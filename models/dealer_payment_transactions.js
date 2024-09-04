const mongoose = require("mongoose");

const dealer_payment_transactions = mongoose.Schema({
    linkId:{type:String},
    status:{type:String},
    dealerId:{type:String},
    fullName:{type:String},
    tcVkn:{type:String},
    taxOffice:{type:String},
    city:{type:String},
    subcity:{type:String},
    phone:{type:String},
    address:{type:String},
    not:{type:String},
    createdAt:{type:Date},
    salesId:{type:String},
    salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'dealer_purchases' },
    piece:{type:Number},
    totalAmount:{type:String},
    email:{type:String},
    merchant_oid:{type:String},
    browserIp:{type:String},
})
module.exports = mongoose.model("dealer_payment_transactions", dealer_payment_transactions)