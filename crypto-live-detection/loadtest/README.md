# Locust Load Test

Hits:
- GET /api/coins
- GET /api/quotes/:id (UUIDs sampled from /api/coins)

Run:
```bash
docker compose --profile loadtest up --build locust
```

Locust UI: http://localhost:8089
