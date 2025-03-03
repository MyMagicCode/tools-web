import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";

// https://github.com/babel/babel/issues/13855
// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

const code = `function square(n:number): number {
  return n * n;
}`;

const ast = parser.parse(code, {
  sourceType: "module",
  plugins: ["jsx", "typescript"],
  strictMode: true,
  sourceFilename: "filename",
});

traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      console.log("n:", path.node.name);
      path.node.name = "x";
    }
  },
});
