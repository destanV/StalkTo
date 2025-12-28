const process = require("process");

module.exports={
    PORT : process.env.PORT || 3000,
    MONGO_URI : process.env.MONGO_URI || "mongodb://localhost:27017",
    MONGO_DB_NAME : process.env.MONGO_DB_NAME || "btc_db"
};
