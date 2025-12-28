const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const INGEST_POLL_SECONDS = Number(process.env.INGEST_POLL_SECONDS || 15);
const COINRANKING_API_KEY = (process.env.COINRANKING_API_KEY || "").trim();

const COINRANKING_URL = "https://api.coinranking.com/v2/coins";
const COINS_KEY = "coins:latest";
const COINS_CHANNEL = "coins";

// For quote lookup
const QUOTE_PREFIX = "quote:"; // quote:<uuid>
const QUOTE_SYMBOL_PREFIX = "quote_symbol:"; // quote_symbol:<SYMBOL>

function headers() {
  return COINRANKING_API_KEY ? { "x-access-token": COINRANKING_API_KEY } : {};
}

async function fetchCoins() {
  const res = await fetch(COINRANKING_URL, { headers: headers() });
  if (!res.ok) throw new Error(`CoinRanking HTTP ${res.status}`);
  const data = await res.json();
  return (data && data.data && data.data.coins) ? data.data.coins : [];
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const redis = createClient({ url: REDIS_URL });
  redis.on("error", (e) => console.error("[ingestor] redis error:", e));
  await redis.connect();

  console.log("[ingestor] connected:", REDIS_URL);
  console.log("[ingestor] poll seconds:", INGEST_POLL_SECONDS);

  while (true) {
    try {
      const coins = await fetchCoins();

      await redis.set(COINS_KEY, JSON.stringify(coins));

      const pipeline = redis.multi();
      for (const c of coins) {
        if (c && c.uuid) pipeline.set(QUOTE_PREFIX + c.uuid, JSON.stringify(c));
        if (c && c.symbol) pipeline.set(QUOTE_SYMBOL_PREFIX + String(c.symbol).toUpperCase(), JSON.stringify(c));
      }
      await pipeline.exec();

      await redis.publish(COINS_CHANNEL, "updated");
      console.log(`[ingestor] stored ${coins.length} coins`);
    } catch (e) {
      console.error("[ingestor] error:", e.message || e);
    }

    await sleep(Math.max(5, INGEST_POLL_SECONDS) * 1000);
  }
}

main().catch((e) => {
  console.error("[ingestor] fatal:", e);
  process.exit(1);
});
