import { BaseElementNode, parse, RootNode } from "@vue/compiler-dom";
import { readFileSync } from "fs";

export function parseSFC(filePath: string) {
  const code = readFileSync(filePath, "utf-8");
  const ast = parse(code);
  const script = getRootScript(ast);
  const { lang, setup, content } = analysisScript(script);
  return {
    lang,
    setup,
    content,
  };
}

export function getRootScript(ast: RootNode) {
  const script = ast.children?.find(
    (node) => node.type === 1 && node.tag === "script"
  ) as BaseElementNode;
  return script;
}

export function analysisScript(script: BaseElementNode) {
  const lang = script.props.find(
    (prop) => prop.type === 6 && prop.name === "lang"
  );
  const setup = script.props.find(
    (prop) => prop.type === 6 && prop.name === "setup"
  );

  const content = script.children?.find((item) => item.type === 2)?.content;

  return {
    lang: lang || "js",
    setup: !!setup,
    content: content || "",
  };
}
