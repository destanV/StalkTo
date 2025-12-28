const express = require('express');
const router = express.Router();
const Price = require('./models/Price'); // mongoose Price modelini çağırdık

//GET
router.get('/price', async (req, res) => {
    try {
        const latestPrice = await Price.findOne().sort({_id: -1});
        if (!latestPrice) {
            return res.json({ message: "Veri bekleniyor...", price: 0 });
        }
        res.json(latestPrice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;