const mongoose = require("mongoose");

const dealer_dealers = mongoose.Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    phone:{type:String, required:true},
    email:{type:String, required:true},
    vkn:{type:String},
    tsicilNo:{type:String},
    password:{type:String, required:true},
    status:{
        type:Boolean,
        default: true,
        required:true
    },
    statusDescription:{
        type:String,
        default: "Aktif",
        required:true
    },
    dealerCommission:{type:Number, required:true},
    subDealerCommission:{type:Number, required:true},
    dealerCode:{type:String, required:true},
    smmRoom:{type:String},
    smmRoomNumber:{type:Number},
    referenceBy: { type: mongoose.Schema.Types.ObjectId, ref: 'dealer_dealers' },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dealer_roles' }],
    isContract:{type:Boolean, default:false, required:true},
    deactivatedAt: { type: Date }, 
    activatedAt: { type: Date }  
})
module.exports = mongoose.model("dealer_dealers", dealer_dealers)