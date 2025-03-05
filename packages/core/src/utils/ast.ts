import { readFileSync } from "fs";
import parser from "@babel/parser";
import { parseSFC } from "./sfc";
import { Node, NodePath } from "@babel/traverse";
import * as t from "@babel/types";

/**
 * 解析文件 返回ast
 * 支持vue文件
 */
export function parseFile(filePath: string) {
  let code = "";
  // 判断是否是vue文件
  if (filePath.endsWith(".vue")) {
    const sfc = parseSFC(filePath);
    code = sfc.content;
  } else {
    code = readFileSync(filePath, "utf-8");
  }
  return parseCode(code);
}

export function parseCode(code: string) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
    strictMode: true,
  });

  return ast;
}

/** 获取当前函数作用域的函数名 */
export function getScopeFunctionName(path: NodePath) {
  // 获取调用函数名 例如：function xxx() {}
  const fn = path.getFunctionParent()?.node;
  let fnName = "";
  if (fn?.type === "FunctionDeclaration") {
    fnName = fn.id?.name || "";
  }

  // 处理箭头函数 例如：const xxx = () => {}
  if (fn?.type === "ArrowFunctionExpression") {
    const identifier = path.getFunctionParent()?.parent;
    if (
      identifier?.type === "VariableDeclarator" &&
      identifier.id.type === "Identifier"
    ) {
      fnName = identifier.id?.name || "";
    }
  }

  return fnName;
}

/**
 * defHttp.post<{ data: Blob }>({
    url: Api.xxx,
    data
  });
  @return Api.xxx 的值
 */
export function getArgumentsUrlValue(
  nodes: Node[],
  varMap?: Record<string, any>
): string | undefined {
  const urlNode = nodes[0];
  if (urlNode.type === "ObjectExpression") {
    const urlProperty = urlNode.properties.find((property) => {
      return (
        property.type === "ObjectProperty" &&
        property.key.type === "Identifier" &&
        property.key.name === "url"
      );
    });
    if (urlProperty?.type === "ObjectProperty") {
      if (urlProperty.value.type === "StringLiteral") {
        return urlProperty.value.value;
      }

      if (urlProperty.value.type === "MemberExpression") {
        return getMemberExpressionPath(urlProperty.value).reduce(
          (obj, property) => {
            return obj?.[property];
          },
          varMap
        ) as unknown as string;
      }
    }
  }
}

export function templateLiteralToString(
  node: t.TemplateLiteral,
  varMap?: Record<string, any>
) {
  const iter = node.expressions[Symbol.iterator]();
  const cooked = node.quasis.map((quasi) => {
    if (!quasi.value.cooked) {
      const expr = iter.next();
      if (expr.value.name) {
        const value = varMap?.[expr.value.name];
        return value;
      }
    }
    return quasi.value.cooked;
  });
  return cooked.join("");
}

export function tsEnumToObject(
  node: t.TSEnumDeclaration,
  varMap?: Record<string, any>
) {
  const members: Record<string, string | number | boolean> = {};
  node.members.forEach((member) => {
    if (member.id.type === "Identifier" && member.initializer) {
      let value: string | number = "";
      switch (member.initializer.type) {
        case "StringLiteral":
        case "NumericLiteral":
          value = member.initializer.value;
          break;
        case "TemplateLiteral":
          value = templateLiteralToString(member.initializer, varMap);
          break;
        default:
          console.warn(
            "[TODO]未处理枚举成员类型值的类型: ",
            member.initializer.type
          );
      }
      members[member.id.name] = value;
    }
  });

  return members;
}

/**
 * 处理 a.b.c 的调用
 * @returns ['a', 'b', 'c']
 */
export function getMemberExpressionPath(node: t.MemberExpression): string[] {
  let property: string = "";

  if (node.property.type === "Identifier") {
    property = node.property.name;
  }

  if (node.object.type === "MemberExpression") {
    return [...getMemberExpressionPath(node.object), property];
  }

  if (node.object.type === "Identifier") {
    return [node.object.name, property];
  }

  console.warn("[TODO]MemberExpression类型: ", node.object.type);
  return [];
}

/**
 * 获取变量引用的对象属性, 去重
 * @returns ['propertyA', 'propertyB', 'propertyC']
 */
export function getVarRefProperty(path: NodePath, name: string) {
  const binding = path.scope.getBinding(name);
  const properties = binding?.referencePaths.map((referencePath) => {
    if (referencePath.parent.type === "MemberExpression") {
      const paths = getMemberExpressionPath(referencePath.parent);
      // 只处理a.b 这种形式
      return paths[1];
    }
  });
  return [...new Set(properties?.filter(Boolean))];
}
