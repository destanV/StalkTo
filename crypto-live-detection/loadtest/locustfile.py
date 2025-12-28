from locust import HttpUser, task, between
import random

class QuoteUser(HttpUser):
    wait_time = between(0.2, 1.0)

    def on_start(self):
        self.ids = []
        self.refresh_ids()

    def refresh_ids(self):
        r = self.client.get("/api/coins")
        if r.status_code == 200:
            coins = r.json().get("coins", [])
            self.ids = [c.get("uuid") for c in coins if c.get("uuid")]
        if not self.ids:
            self.ids = ["BTC", "ETH"]

    @task(6)
    def list_coins(self):
        self.client.get("/api/coins")

    @task(8)
    def get_quote_by_id(self):
        qid = random.choice(self.ids) if self.ids else "BTC"
        self.client.get(f"/api/quotes/{qid}")

    @task(1)
    def refresh_pool(self):
        self.refresh_ids()
