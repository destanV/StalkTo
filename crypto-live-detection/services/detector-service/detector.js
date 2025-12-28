const { createClient } = require("redis");
const { detectSpikes } = require("./rules");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const THRESHOLD = Number(process.env.DETECT_CHANGE_THRESHOLD || 5);
const DEDUP_SECONDS = Number(process.env.ALERT_DEDUP_SECONDS || 60);

const COINS_KEY = "coins:latest";
const COINS_CHANNEL = "coins";

const ALERTS_CHANNEL = "alerts";
const ALERTS_LIST_KEY = "alerts:latest";
const MAX_ALERTS = 300;

async function main() {
  const redis = createClient({ url: REDIS_URL });
  redis.on("error", (e) => console.error("[detector] redis error:", e));
  await redis.connect();

  const sub = redis.duplicate();
  await sub.connect();

  console.log("[detector] threshold =", THRESHOLD);

  await sub.subscribe(COINS_CHANNEL, async () => {
    try {
      const raw = await redis.get(COINS_KEY);
      if (!raw) return;

      const coins = JSON.parse(raw);
      const alerts = detectSpikes(coins, THRESHOLD);
      if (!alerts.length) return;

      const now = Math.floor(Date.now() / 1000);

      for (const a of alerts) {
        const sym = (a.symbol || "").toUpperCase();
        const dedupKey = `alerted:${sym}`;
        if (await redis.exists(dedupKey)) continue;

        a.ts = now;
        const payload = JSON.stringify(a);

        await redis.publish(ALERTS_CHANNEL, payload);
        await redis.lPush(ALERTS_LIST_KEY, payload);
        await redis.lTrim(ALERTS_LIST_KEY, 0, MAX_ALERTS - 1);

        await redis.setEx(dedupKey, Math.max(10, DEDUP_SECONDS), "1");
      }
    } catch (e) {
      console.error("[detector] error:", e.message || e);
    }
  });
}

main().catch((e) => {
  console.error("[detector] fatal:", e);
  process.exit(1);
});
