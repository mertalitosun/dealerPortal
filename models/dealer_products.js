const mongoose = require("mongoose");

const dealer_products = mongoose.Schema({
    name:{type:String, required:true},
    price:{type:Number, required:true},
    productCode:{type:String, required:true},
    type: {type: mongoose.Schema.Types.ObjectId, ref:"dealer_product_type"}
})
module.exports = mongoose.model("dealer_products", dealer_products)