# Crypto Live Detection (Microservices)

This project keeps the UI in **vanilla HTML/CSS/JS** but runs the backend as microservices.

## Services (local via Docker Compose)
- **web-frontend (Nginx)**: serves the UI and proxies `/api/*`, `/ws/*`, `/version` to `api-service`
- **api-service** (your "quote service"): REST API + WebSocket alerts + `/version` + `/metrics`
- **ingestor-service**: polls CoinRanking and stores latest coins in Redis
- **detector-service**: listens for coin updates and publishes alerts
- **redis**: cache + pub/sub backbone
- **prometheus**: scrapes `/metrics` from `api-service`
- **grafana**: dashboards (pre-provisioned)
- **loki** (+ optional **promtail**): logging (optional promtail profile)
- **locust**: load testing (optional loadtest profile)

## Quick start (local)
1) Copy environment:
```bash
cp .env.example .env
```

2) Run locally:
```bash
docker compose up --build
```

Open:
- UI: http://localhost:8080
- API: http://localhost:8000/api/coins
- Quote by ID: http://localhost:8000/api/quotes/<uuid-or-symbol>
- Service version: http://localhost:8000/version
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000  (admin/admin)

## Load testing (Locust)
```bash
docker compose --profile loadtest up --build locust
```
Locust UI: http://localhost:8089

## Logging (optional Promtail -> Loki)
```bash
docker compose --profile logging up -d promtail
```

## GitOps / Kubernetes (Argo CD)
This repo includes `deploy/k8s` manifests and Argo CD Application examples.
See:
- `deploy/k8s/base/` (Deployments/Services/Ingress)
- `deploy/k8s/overlays/dev` and `deploy/k8s/overlays/prod` (Kustomize overlays)
- `deploy/argocd/application-dev.yaml` (Argo CD Application)

> Note: This is the *GitOps layout*; you still need a cluster + Argo CD installed to actually sync it.


## Docker Desktop note (about “no Image / no Container ID”)
If you see a row like `crypto_det` with dashes for Image/Container ID/Ports in Docker Desktop, that row is the **Compose app group**, not a single container.
Click the small arrow to expand it — you’ll then see each service container with its own **Image**, **Container ID**, and **Ports**.
