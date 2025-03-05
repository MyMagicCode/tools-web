import _traverse, { NodePath } from "@babel/traverse";
import {
  PathResolver,
  getArgumentsUrlValue,
  getScopeFunctionName,
  getVarRefProperty,
  parseFile,
  tsEnumToObject,
} from "./utils";
import path from "path";
import { writeFileSync } from "fs";

// https://github.com/babel/babel/issues/13855
// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

let paths = [
  {
    name: "入库单列表",
    componentPath: "./warehousing/InventoryIn/index.vue",
  },
  {
    name: "新增入库单",
    componentPath: "./warehousing/InventoryIn/create/index.vue",
  },
  {
    name: "入库单详情",
    componentPath: "./warehousing/InventoryIn/detail.vue",
  },
  {
    name: "入库",
    componentPath: "./warehousing/InventoryIn/edit/index.vue",
  },
  {
    name: "入库明细",
    componentPath: "./warehousing/InventoryIn/SlipDetails/index.vue",
  },
  {
    name: "出库单列表",
    componentPath: "./warehousing/InventoryOut/index.vue",
  },
  {
    name: "新增出库",
    componentPath: "./warehousing/InventoryOut/create/index.vue",
  },
  {
    name: "出库",
    componentPath: "./warehousing/InventoryOut/edit/index.vue",
  },
  {
    name: "出库单详情",
    componentPath: "./warehousing/InventoryOut/detail.vue",
  },
  {
    name: "出库明细",
    componentPath: "./warehousing/InventoryOut/SlipDetails/index.vue",
  },
  {
    name: "DF可售库存",
    componentPath: "./warehousing/df-inventory/list.vue",
  },
  {
    name: "库存管理",
    componentPath: "./warehousing/InventoryManage/index.vue",
  },
  {
    name: "仓库配置",
    componentPath: "./warehousing/warehouseConfiguration/index.vue",
  },
  {
    name: "仓库配置详情",
    componentPath: "./warehousing/warehouseConfiguration/detail.vue",
  },
  {
    name: "增值服务",
    componentPath: "./warehousing/storage-serve/increment-serve/list/index.vue",
  },
  {
    name: "新增增值服务单",
    componentPath: "./warehousing/storage-serve/increment-serve/add/index.vue",
  },
  {
    name: "增值服务单详情",
    componentPath:
      "./warehousing/storage-serve/increment-serve/detail/index.vue",
  },
  {
    name: "测试",
    componentPath: "@/views/goods-center/goods-list/edit",
  },
];

// let paths = [
//   {
//     name: "入库单列表",
//     componentPath: "@/api/common/index.ts",
//   },
// ];

const viewPath = `/Users/mac/Desktop/work/aplus-user-WMS/src/views`;
const rootPath = `/Users/mac/Desktop/work/aplus-user-WMS`;

const resolver = new PathResolver(rootPath, viewPath);

const menuPaths = paths.map((path) => {
  return resolver.getMenuPath(path.componentPath);
});

interface File {
  path: string;
  imports: {
    specifier: string[];
    source: string;
  }[];
  apiMap: Record<string, { method: string; url: string | string[] }>;
}

const fileMap = new Map<string, File>();

menuPaths.forEach((item) => {
  if (item?.path) {
    getDeepFileTree(item?.path);
  }
});

/** 是否是忽略的路径 */
function isIgnorePath(filePath: string) {
  return (
    filePath.includes("node_modules") ||
    filePath.includes("virtual:svg-icons-names")
  );
}

export function getDeepFileTree(filePath: string) {
  if (fileMap.has(filePath)) {
    return;
  }

  const file: File = {
    path: filePath,
    imports: [],
    apiMap: {},
  };
  const dirPath = path.dirname(filePath);
  const ast = parseFile(filePath);

  fileMap.set(filePath, file);

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
      const filePath = resolver.sync(dirPath, path.node.source.value);

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
            console.log("properties", properties, specifier.local.name);

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
    getDeepFileTree(item.source);
  });
}

// 写入文件
writeFileSync(
  "./file.json",
  JSON.stringify(Object.fromEntries(fileMap), null, 2)
);
