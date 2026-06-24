const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { URL } = require("url");

const port = Number(process.env.PORT || 8080);
const inventoryApiUrl =
  process.env.INVENTORY_API_URL ||
  "http://inventory-api.production.svc.cluster.local:8080";
const publicDir = path.join(__dirname, "public");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = contentTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: "File not found" });
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function proxyInventory(res) {
  const upstream = new URL("/api/inventory", inventoryApiUrl);
  const client = upstream.protocol === "https:" ? https : http;

  const request = client.request(
    {
      hostname: upstream.hostname,
      method: "GET",
      path: upstream.pathname,
      port: upstream.port,
      timeout: 5000,
    },
    (upstreamRes) => {
      let body = "";
      upstreamRes.on("data", (chunk) => {
        body += chunk;
      });
      upstreamRes.on("end", () => {
        res.writeHead(upstreamRes.statusCode || 200, {
          "Content-Type": upstreamRes.headers["content-type"] || "application/json; charset=utf-8",
        });
        res.end(body);
      });
    },
  );

  request.on("error", (error) => {
    sendJson(res, 502, {
      error: "Unable to reach inventory API",
      details: error.message,
      upstream: inventoryApiUrl,
    });
  });

  request.on("timeout", () => {
    request.destroy(new Error("Upstream request timed out"));
  });

  request.end();
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing request URL" });
    return;
  }

  if (req.url === "/healthz") {
    sendJson(res, 200, {
      app: "clientfacing-ui",
      status: "ok",
      upstream: inventoryApiUrl,
    });
    return;
  }

  if (req.url === "/api/inventory") {
    proxyInventory(res);
    return;
  }

  if (req.url === "/config.js") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(`window.APP_CONFIG = ${JSON.stringify({ inventoryApiUrl })};`);
    return;
  }

  const requestedPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  serveFile(res, path.join(publicDir, safePath));
});

server.listen(port, () => {
  console.log(`clientfacing-ui listening on ${port}`);
});

