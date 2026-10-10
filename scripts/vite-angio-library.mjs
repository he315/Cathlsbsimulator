// Serves the locally built real-angiogram library (datasets/library) at
// /angio-library/* in the dev and preview servers. The library is built from
// openly licensed datasets by scripts/angio_library/*.py and is not bundled.
import fs from "node:fs";
import path from "node:path";

const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

export default function angioLibrary(root) {
  const dir = path.resolve(root, "datasets", "library");
  const handler = (req, res, next) => {
    if (!req.url) return next();
    let rel;
    try {
      rel = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      res.statusCode = 400;
      return res.end();
    }
    const file = path.normalize(path.join(dir, rel));
    if (!file.startsWith(dir + path.sep)) {
      res.statusCode = 403;
      return res.end();
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.statusCode = 404;
        return res.end();
      }
      res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=3600");
      fs.createReadStream(file).pipe(res);
    });
  };
  // Development only: POST /__capture/<name>.png with a PNG body saves a rendered frame to
  // datasets/tmp/captures/ so it can be compared with real cine frames offline.
  const capDir = path.resolve(root, "datasets", "tmp", "captures");
  const capture = (req, res, next) => {
    if (req.method !== "POST" || !req.url) return next();
    const name = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    if (!/^[A-Za-z0-9_.-]{1,80}\.png$/.test(name)) {
      res.statusCode = 400;
      return res.end("bad name");
    }
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 20 * 1024 * 1024) req.destroy();
      else chunks.push(c);
    });
    req.on("end", () => {
      fs.mkdirSync(capDir, { recursive: true });
      fs.writeFile(path.join(capDir, name), Buffer.concat(chunks), (err) => {
        res.statusCode = err ? 500 : 200;
        res.end(err ? "error" : "ok");
      });
    });
  };
  return {
    name: "angio-library",
    configureServer(server) {
      server.middlewares.use("/angio-library", handler);
      server.middlewares.use("/__capture", capture);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/angio-library", handler);
    },
  };
}
