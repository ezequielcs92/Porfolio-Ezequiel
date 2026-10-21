"use strict";

// Servidor de vista previa: lista cerrada de archivos públicos, nunca los documentos del proyecto.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/motion.css", ["motion.css", "text/css; charset=utf-8"]],
  ["/jack.css", ["jack.css", "text/css; charset=utf-8"]],
  ["/amplify.css", ["amplify.css", "text/css; charset=utf-8"]],
  ["/ezequiel-portrait.webp", ["ezequiel-portrait.webp", "image/webp"]],
  ["/nomada-preview.webp", ["nomada-preview.webp", "image/webp"]],
  ["/config.js", ["config.js", "text/javascript; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/motion.js", ["motion.js", "text/javascript; charset=utf-8"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]],
  ["/robots.txt", ["robots.txt", "text/plain; charset=utf-8"]],
]);
const port = Number(process.env.PORT || 4173);
const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
  let pathname;
  try { pathname = new URL(req.url, "http://localhost").pathname; } catch { res.writeHead(400); return res.end(); }
  const file = files.get(pathname);
  if (!file) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado"); }
  fs.readFile(path.join(__dirname, file[0]), (error, content) => {
    if (error) { res.writeHead(500); return res.end("No se pudo abrir el recurso"); }
    res.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Robots-Tag": "noindex, nofollow" });
    res.end(req.method === "HEAD" ? undefined : content);
  });
});
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, "127.0.0.1", () => { console.log(`Landing disponible en http://127.0.0.1:${port}`); });
