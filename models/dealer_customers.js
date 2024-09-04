const mongoose = require("mongoose");

const dealer_customers = mongoose.Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    phone:{type:String, required:true},
    organization:{type:String, required:true},
    customerCode:{type:String, required:true},
    addedBy: {type: mongoose.Schema.Types.ObjectId, ref:"dealer_dealers"},
    tcVkn:{type:String, required:true},
    
})
module.exports = mongoose.model("dealer_customers", dealer_customers)