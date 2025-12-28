const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { createClient } = require("redis");
const client = require("prom-client");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const COINS_KEY = "coins:latest";
const ALERTS_LIST_KEY = "alerts:latest";
const ALERTS_CHANNEL = "alerts";

// Per-coin lookup keys (written by ingestor-service)
const QUOTE_PREFIX = "quote:"; // quote:<uuid>
const QUOTE_SYMBOL_PREFIX = "quote_symbol:"; // quote_symbol:<SYMBOL>

const app = express();
const server = http.createServer(app);

// WS server for /ws/alerts
const wss = new WebSocket.Server({ server, path: "/ws/alerts" });

function safeLower(x) {
  return (x || "").toString().toLowerCase();
}

// ---------------- Prometheus metrics ----------------
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route ? req.route.path : req.path;
    end({ method: req.method, route, status_code: String(res.statusCode) });
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ---------------- Version endpoint ----------------
app.get("/version", (req, res) => {
  res.json({
    service: process.env.SERVICE_NAME || "api-service",
    version: process.env.SERVICE_VERSION || "0.0.0",
    commit: process.env.GIT_COMMIT || "unknown",
    buildTime: process.env.BUILD_TIME || "unknown",
  });
});

// ---------------- Helpers ----------------
async function getCoins(redis, search) {
  const raw = await redis.get(COINS_KEY);
  if (!raw) return [];

  let coins = JSON.parse(raw);
  if (search) {
    coins = coins.filter(
      (c) => safeLower(c.name).includes(search) || safeLower(c.symbol).includes(search)
    );
  }
  return coins;
}

async function getQuoteById(redis, id) {
  const raw = await redis.get(QUOTE_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

async function getQuoteBySymbol(redis, symbol) {
  const raw = await redis.get(QUOTE_SYMBOL_PREFIX + String(symbol).toUpperCase());
  return raw ? JSON.parse(raw) : null;
}

async function main() {
  const redis = createClient({ url: REDIS_URL });
  redis.on("error", (e) => console.error("[api] redis error:", e));
  await redis.connect();

  // PubSub subscriber
  const sub = redis.duplicate();
  sub.on("error", (e) => console.error("[api] sub error:", e));
  await sub.connect();

  // REST: coins
  app.get("/api/coins", async (req, res) => {
    try {
      const search = (req.query.search || "").toString().trim().toLowerCase();
      const coins = await getCoins(redis, search);
      res.json({ coins, source: coins.length ? "redis" : "empty-cache" });
    } catch (e) {
      res.status(500).json({ error: "failed_to_get_coins" });
    }
  });

  // REST: quote by uuid OR symbol
  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const id = (req.params.id || "").toString().trim();
      if (!id) return res.status(400).json({ error: "invalid_id" });

      let quote = await getQuoteById(redis, id);
      if (!quote) quote = await getQuoteBySymbol(redis, id);

      if (!quote) return res.status(404).json({ error: "quote_not_found", id });

      res.json({ quote });
    } catch (e) {
      res.status(500).json({ error: "failed_to_get_quote" });
    }
  });

  // REST: alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
      const rows = await redis.lRange(ALERTS_LIST_KEY, 0, limit - 1);
      const alerts = rows.map((r) => {
        try { return JSON.parse(r); } catch { return { raw: r }; }
      });
      res.json({ alerts });
    } catch (e) {
      res.status(500).json({ error: "failed_to_get_alerts" });
    }
  });

  // Health endpoints
  app.get("/healthz", (req, res) => res.json({ service: "api-service", status: "ok" }));
  app.get("/readyz", async (req, res) => {
    try {
      await redis.ping();
      res.json({ service: "api-service", status: "ready" });
    } catch {
      res.status(503).json({ service: "api-service", status: "not-ready" });
    }
  });

  // WebSocket clients list
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: "hello", service: "api-service" }));

    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
    ws.on("message", () => {});
  });

  function broadcast(rawMessage) {
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(rawMessage);
    }
  }

  // Bridge Redis alerts -> WS
  await sub.subscribe(ALERTS_CHANNEL, (message) => broadcast(message));

  const PORT = 8000;
  server.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
}

main().catch((e) => {
  console.error("[api] fatal:", e);
  process.exit(1);
});
