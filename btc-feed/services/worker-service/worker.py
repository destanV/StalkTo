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

url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin&vs_currencies=usd"

print("worker servisi başlatıldı")

while True:
    try:
        anti_cache_url = f"{url}&_={int(time.time())}" # cache engelle
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(anti_cache_url, headers=headers, timeout=10)
        data = response.json()
        
        # coingecko api res: {'bitcoin': {'usd': 87500.12}, 'ethereum': {'usd': 2500}, ...}
        coins = ['bitcoin', 'ethereum', 'litecoin']
        for coin in coins:
            if coin in data and 'usd' in data[coin]:
                current_price = float(data[coin]["usd"])
                current_time = int(time.time() * 1000)

                pair = {
                    'bitcoin': 'BTCUSDT',
                    'ethereum': 'ETHUSDT',
                    'litecoin': 'LTCUSDT'
                }.get(coin, f"{coin.upper()}USDT")

                to_be_inserted = {
                    "timestamp": current_time,
                    "price": current_price,
                    "pair": pair,
                    "source": "CoinGecko"
                }

                collection.insert_one(to_be_inserted)
                print(f"veritabanına {coin} fiyat yazdık: {current_price}")
            else:
                print(f" {coin} için beklenmedik response: {data}")

    except Exception as e:
        print(f"hata: {e}")
    time.sleep(30)  # Increased from 10 to 30 seconds to avoid rate limits