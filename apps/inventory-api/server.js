const http = require("http");

const port = Number(process.env.PORT || 8080);
const version = process.env.APP_VERSION || "v1";
const region = process.env.DEMO_REGION || "unknown";
const cluster = process.env.DEMO_CLUSTER || "unknown";

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function inventoryResponse() {
  return {
    app: "inventory-api",
    version,
    cluster,
    region,
    generatedAt: new Date().toISOString(),
    items: [
      {
        sku: "SKU-1001",
        name: "Blue Widget",
        category: "widgets",
        quantity: 42,
        region: "primary",
        status: "in-stock",
      },
      {
        sku: "SKU-2004",
        name: "Route Sensor",
        category: "devices",
        quantity: 9,
        region: "secondary",
        status: "low-stock",
      },
      {
        sku: "SKU-7810",
        name: "Transit Crate",
        category: "shipping",
        quantity: 64,
        region: "central",
        status: "in-stock",
      },
    ],
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing request URL" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    });
    res.end();
    return;
  }

  if (req.url === "/" || req.url === "/api/status") {
    sendJson(res, 200, {
      app: "inventory-api",
      status: "ok",
      version,
      cluster,
      region,
    });
    return;
  }

  if (req.url === "/healthz") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.url === "/api/inventory") {
    sendJson(res, 200, inventoryResponse());
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`inventory-api listening on ${port}`);
});

