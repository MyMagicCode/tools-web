import { createApp, defineEventHandler, serveStatic } from "h3";
import { createServer } from "node:http";
import { toNodeListener } from "h3";
import { stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { lookup } from "mrmime";

const app = createApp();

const publicDir = join(__dirname, "../out");

app.use(
  defineEventHandler((event) => {
    return serveStatic(event, {
      getContents: (id) => {
        const path = join(publicDir, id);
        console.log("path", path);
        readFile(path).then();
        return readFile(path);
      },
      getMeta: async (id) => {
        const stats = await stat(join(publicDir, id)).catch(() => {});
        if (!stats || !stats.isFile()) return;
        console.log("stats", id.split(".")[1]);
        return {
          type: lookup(id),
          size: stats.size,
          mtime: stats.mtimeMs,
        };
      },
      fallthrough: true,
      indexNames: ["/index.html"],
    });
  })
);

createServer(toNodeListener(app)).listen(process.env.PORT || 3000);
