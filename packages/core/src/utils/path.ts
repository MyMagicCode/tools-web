import { ResolverFactory } from "oxc-resolver";

/** 解析路径绝对路径 */
export class PathResolver extends ResolverFactory {
  private _viewPath: string;
  constructor(rootPath: string, viewPath: string) {
    // bug ESNext
    // const tsconfigPath = path.join(rootPath, "tsconfig.json");
    super({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".vue", ".d.ts"],
      roots: [rootPath],
      alias: {
        "@": ["/src"],
        "#": ["/types"],
      },
      // tsconfig: {
      //   configFile: tsconfigPath,
      //   references: "auto",
      // },
      conditionNames: ["node", "import"],
    });
    this._viewPath = viewPath;
  }
  /**
   * 获取菜单绝对路径
   * @returns
   */
  getMenuPath(menuPath: string) {
    return this.sync(this._viewPath, "." + menuPath);
  }
}
