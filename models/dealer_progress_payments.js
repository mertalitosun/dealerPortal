const mongoose = require("mongoose");

const dealer_progress_payments= mongoose.Schema({
    dealerId:{type:mongoose.Schema.Types.ObjectId, ref: "dealer_dealers", required:true},
    payment:{type:Number},
    date:{type:Date},
    status:{type:Boolean}
})
module.exports = mongoose.model("dealer_progress_payments", dealer_progress_payments)