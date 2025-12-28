import requests
import time
import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "btc_db")

try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    collection = db["prices"]
    print(f"mongoDB bağlantı başarılı")
except Exception as e:
    print(f"mongoDB hata: {e}")

url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"

print("worker servisi başlatıldı")

while True:
    try:
        anti_cache_url = f"{url}&_={int(time.time())}" # cache engelle
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(anti_cache_url, headers=headers, timeout=10)
        data = response.json()
        
        # coingecko api res: {'bitcoin': {'usd': 87500.12}}
        if "bitcoin" in data:
            current_price = float(data["bitcoin"]["usd"])
            current_time = int(time.time() * 1000)

            to_be_inserted = {
                "timestamp": current_time,
                "price": current_price,
                "pair": "BTCUSDT",
                "source": "CoinGecko"
            }

            collection.insert_one(to_be_inserted)
            print(f"veritabanına fiyat yazdık: {current_price}")
        else:
            print(f" beklenmedik response: {data}")

    except Exception as e:
        print(f"hata: {e}")
    time.sleep(10)