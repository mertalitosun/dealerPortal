const mongoose = require("mongoose");

const dealer_product_type = mongoose.Schema({
   name:String
})
module.exports = mongoose.model("dealer_product_type", dealer_product_type)