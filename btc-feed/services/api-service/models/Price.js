const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    timestamp: Number,
    price: Number,
    pair: String
});

module.exports = mongoose.model("Price", priceSchema);