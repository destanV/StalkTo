const express = require('express');
const router = express.Router();
const Price = require('./models/Price'); // mongoose Price modelini çağırdık

//GET
router.get('/price', async (req, res) => {
    try {
        const pairs = ['BTCUSDT', 'ETHUSDT', 'LTCUSDT'];
        const prices = {};
        for (const pair of pairs) {
            const latestPrice = await Price.findOne({ pair }).sort({ timestamp: -1 });
            if (latestPrice) {
                prices[pair] = latestPrice;
            } else {
                prices[pair] = { message: "Veri bekleniyor...", price: 0 };
            }
        }
        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;