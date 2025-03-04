import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import { PathResolver } from "./utils";

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

const viewPath = `/Users/mac/Desktop/work/aplus-user-WMS/src/views`;
const rootPath = `/Users/mac/Desktop/work/aplus-user-WMS`;

const resolver = new PathResolver(rootPath, viewPath);

const menuPaths = paths.map((path) => {
  return resolver.getMenuPath(path.componentPath);
});

menuPaths.forEach((path) => {
  console.log("path:", path);
});

traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      console.log("n:", path.node.name);
      path.node.name = "x";
    }
  },
});
