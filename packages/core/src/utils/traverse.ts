import _traverse from "@babel/traverse";
import path from "path";
import {
  getArgumentsUrlValue,
  getScopeFunctionName,
  getVarRefProperty,
  parseFile,
  tsEnumToObject,
} from "./ast";
import { PathResolver } from "./path";

// https://github.com/babel/babel/issues/13855
// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

export interface File {
  path: string;
  imports: {
    specifier: string[];
    source: string;
  }[];
  apiMap: Record<string, { method: string; url: string | string[] }>;
}

interface Menu {
  name: string;
  componentPath: string;
}

export class TraverseMenus {
  resolver: PathResolver;
  fileMap: Map<string, File>;
  constructor(rootPath: string, viewPath: string) {
    this.resolver = new PathResolver(rootPath, viewPath);

    this.fileMap = new Map<string, File>();
  }
  traverseMenus(menus: Menu[]) {
    menus.forEach((item) => {
      const pathResult = this.resolver.getMenuPath(item.componentPath);

      if (pathResult?.path) {
        this.deepFileTree(pathResult.path);
      }
    });
  }
  private deepFileTree(filePath: string) {
    if (this.fileMap.has(filePath)) {
      return;
    }

    const file: File = {
      path: filePath,
      imports: [],
      apiMap: {},
    };
    const dirPath = path.dirname(filePath);
    const ast = parseFile(filePath);

    this.fileMap.set(filePath, file);

    const _this = this;

    traverse(ast, {
      Program: {
        enter(path) {
          // 保存枚举
          path.state = {
            varMap: {},
          };
        },
      },
      Declaration(path) {
        if (path.scope.block.type === "Program") {
          switch (path.node.type) {
            case "TSEnumDeclaration":
              path.state.varMap[path.node.id.name] = tsEnumToObject(
                path.node,
                path.state.varMap
              );
              break;
            case "VariableDeclaration":
              path.node.declarations.forEach((declaration) => {
                if (
                  declaration.id.type === "Identifier" &&
                  declaration.init?.type === "StringLiteral"
                ) {
                  path.state.varMap[declaration.id.name] =
                    declaration.init?.value;
                }
              });
              break;
          }
        }
      },
      ImportDeclaration(path) {
        const filePath = _this.resolver.sync(dirPath, path.node.source.value);

        // 过滤node_modules
        if (!filePath.path || isIgnorePath(filePath.path)) {
          if (filePath.error) {
            console.warn("filePath", filePath.error);
          }
          return;
        }

        const specifier = path.node.specifiers
          .map((specifier) => {
            // 处理 import { a as b } from 'c'
            if (specifier.type === "ImportSpecifier") {
              return specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : specifier.imported.value;
            }

            // TODO: 处理 import a from 'c'
            if (specifier.type === "ImportDefaultSpecifier") {
              const properties = getVarRefProperty(path, specifier.local.name);
              return properties;
            }

            // TODO: 处理 import * as a from 'c'
            if (specifier.type === "ImportNamespaceSpecifier") {
              const properties = getVarRefProperty(path, specifier.local.name);
              return properties;
            }
          })
          .filter(Boolean)
          .flat(1) as string[];

        file.imports.push({
          specifier: specifier,
          source: filePath.path || path.node.source.value,
        });
      },
      CallExpression(path) {
        if (path.node.callee.type === "MemberExpression") {
          const member = path.node.callee;
          // 处理 defHttp.xxx 的调用
          if (
            member.object.type === "Identifier" &&
            member.object.name === "defHttp"
          ) {
            const fnName = getScopeFunctionName(path);
            file.apiMap[fnName] = {
              method: "",
              url:
                getArgumentsUrlValue(path.node.arguments, path.state.varMap) ||
                "",
            };

            // 获取调用方法 post/get/put/delete
            const property = path.node.callee.property;
            if (property.type === "Identifier" && file.apiMap[fnName]) {
              file.apiMap[fnName].method = property.name;
            }
          }
        }
      },
    });

    file.imports.forEach((item) => {
      this.deepFileTree(item.source);
    });
  }
}

/** 是否是忽略的路径 */
function isIgnorePath(filePath: string) {
  return (
    filePath.includes("node_modules") ||
    filePath.includes("virtual:svg-icons-names")
  );
}
