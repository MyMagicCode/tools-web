import parser from "@babel/parser";

parser.parse("const a = 1;", {
  sourceType: "module",
  plugins: ["jsx"],
  strictMode: false,
  ranges: true,
  tokens: true,
  createParenthesizedExpressions: true,
  createImportExpressions: true,
  sourceFilename: "filename",
  startIndex: 0,
  startLine: 0,
  startColumn: 0,
});

export function hello() {
  console.log("Hello, world!");
}
