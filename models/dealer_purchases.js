const mongoose = require("mongoose");

const dealer_purchases= mongoose.Schema({
    name:{type:String, required:true},
    price:{type:Number, required:true},
    purchaseCode:{type:String, required:true},
    purchaseDate:{type:Date, required:true},
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "dealer_customers",required:true},
    dealerId: { type: mongoose.Schema.Types.ObjectId, ref: "dealer_dealers",required:true},
    status: {
        type: String,
        enum: ['Onay Bekliyor', 'Onaylandı', 'İşlemde', 'Tamamlandı', 'İptal edildi', 'İade edildi'],
        default: 'Onay Bekliyor'
    },
    type:{type:String, required:true},

    paymentStatus:{type:String},

    integrationName:{type:String},
    isGift:{type:String},
    giftRate:{type:String},
    giftPiece:{type:String},
    paymentStatus:{type: String}
},{ timestamps: true })
module.exports = mongoose.model("dealer_purchases", dealer_purchases)