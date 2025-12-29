const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cfg = require('./cfg');       
const apiRoutes = require('./endpoints');
const Price = require("./models/Price");
const http = require('http');
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //heryerden gelen bağlantıyı kabul et
        methods: ["GET", "POST"]
    }
});
const connectionString = `${cfg.MONGO_URI}/${cfg.MONGO_DB_NAME}`;

console.log(`baglaniyor: ${connectionString}`);

mongoose.connect(connectionString)
  .then(() => {
      console.log("Mongo bağlandık");
      // Her 10 saniyede bir son fiyatları alıp bağlı kullanıcılara "yayınlıyoruz"
      setInterval(async () => {
          try {
              const pairs = ['BTCUSDT', 'ETHUSDT', 'LTCUSDT'];
              const prices = {};
              for (const pair of pairs) {
                  const latestPrice = await Price.findOne({ pair }).sort({ timestamp: -1 });
                  if (latestPrice) {
                      prices[pair] = latestPrice;
                  }
              }
              if (Object.keys(prices).length > 0) {
                  // 'price_update' kanalı üzerinden veriyi fırlat
                  io.emit('price_update', prices);
              }
          } catch (err) {
              console.error("Veri okuma hatası:", err);
          }
      }, 10000);
  })
  .catch(err => {
      console.error("Mongo bağlantı hatası:", err);
      process.exit(1);
  });

// /api 'ye apiRoutes'tan gelenleri bağlıyoruz <- /api/price (GET)
app.use('/api', apiRoutes);

// socket baglantı
io.on('connection', (socket) => {
    console.log('connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('disconnected:', socket.id);
    });
});
// çalıştır
server.listen(cfg.PORT, () => {
    console.log(`API  http://localhost:${cfg.PORT} 'da çalışıyor: `);
});