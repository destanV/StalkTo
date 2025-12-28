import requests
import time
import os
from pymongo import MongoClient

# env var al
MONGO_URI = os.getenv("MONGO_URI","mongodb://localhost:27017") # bulamazsa virgülden sonraki
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME","btc_db")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection = db["prices"] # tablo adı

url = "https://api.btcturk.com/api/v2/ticker?pairSymbol=BTCUSDT"
print("Worker başlıyor...")
while True:
    try:
        response = requests.get(url)
        json = response.json()
        data = json["data"][0]
        to_be_inserted = {
            "timestamp" : data["timestamp"],
            "price" : data["last"],
            "pair" : "BTCUSDT"
        }
        collection.insert_one(to_be_inserted)
        print(f"Veritabanına {to_be_inserted["timestamp"]} timestampinde {to_be_inserted["price"] }fiyatı yazıldı (btcusd)")

    except Exception as e:
        print("Hata: ",e)

    time.sleep(5)