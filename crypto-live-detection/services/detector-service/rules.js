function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * Alert if abs(change%) >= threshold
 * CoinRanking `change` is typically 24h percentage change.
 */
function detectSpikes(coins, threshold) {
  const alerts = [];
  for (const c of coins) {
    const change = toNumber(c.change);
    if (change === null) continue;

    if (Math.abs(change) >= threshold) {
      alerts.push({
        type: "alert",
        rule: "abs_change_threshold",
        threshold,
        uuid: c.uuid,
        name: c.name,
        symbol: c.symbol,
        price: toNumber(c.price),
        change
      });
    }
  }
  return alerts;
}

module.exports = { detectSpikes };
