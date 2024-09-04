const mongoose = require("mongoose");

const dealer_credit_prices = mongoose.Schema({
    integrationName:{type:String},
    unitPrice:{type:String},
    piece:{type:String},
})
module.exports = mongoose.model("dealer_credit_prices", dealer_credit_prices)