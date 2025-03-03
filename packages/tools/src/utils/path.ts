import { ResolverFactory } from "oxc-resolver";
import path from "path";

export class PathResolver extends ResolverFactory {
  constructor(rootPath: string) {
    // bug ESNext
    // const tsconfigPath = path.join(rootPath, "tsconfig.json");
    super({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
      roots: [rootPath],
      // "@/*": ["src/*"],
      // "#/*": ["types/*"]
      alias: {
        "@": ["/src"],
        "#": ["/types"],
      },
      conditionNames: ["node", "import"],
    });
  }
}
