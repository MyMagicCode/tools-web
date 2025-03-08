import { aplusNetwork } from "./network";
import { Menu, TraverseMenus } from "./utils";
import { writeFileSync } from "fs";

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

const t = new TraverseMenus(rootPath, viewPath);

const aplus = new aplusNetwork();

const result = aplus.post("authorize/menus/mangerMenuList", {
  json: {
    platform: "APLUS",
    position: "LEFT",
  },
});

result.then((r) => {
  const menus = r.body;

  t.traverseMenus(filterMenuType(menus));

  // 写入文件
  writeFileSync(
    "./file.json",
    JSON.stringify(Object.fromEntries(t.fileMap), null, 2)
  );

  // console.dir(filterMenuType(menus), { depth: 3 });
});

function filterMenuType(menuList: any[], buttonCodes?: Menu["buttonCodes"]) {
  const result: Menu[] = [];
  menuList.forEach((item) => {
    let menu: Menu | null = null;
    if (item.menuType === "2") {
      menu = {
        name: item.zhName,
        componentPath: item.component,
        menuCode: item.menuCode,
        buttonCodes: [],
      };
      result.push(menu);
    }

    if (item.menuType === "3" && buttonCodes) {
      buttonCodes.push({
        name: item.zhName,
        menuCode: item.menuCode,
      });
    }

    if (item.children?.length > 0) {
      result.push(...filterMenuType(item.children, menu?.buttonCodes));
    }
  });
  return result;
}
