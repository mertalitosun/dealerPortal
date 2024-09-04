const mongoose = require("mongoose");

const dealer_payment_links = mongoose.Schema({
    dealerId:{type:String},
    processId:{type:String},
    link:{type:String},
    totalAmount:{type:String},
    isActive:{type:String},
    createdAt:{type:String},
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "dealer_purchases",required:true},
    
})
module.exports = mongoose.model("dealer_payment_links", dealer_payment_links)