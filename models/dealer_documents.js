const mongoose = require("mongoose");

const dealer_documents = mongoose.Schema({
    name:{type:String},
    url:{type:String},
    dealerId:{type:mongoose.Schema.Types.ObjectId, ref: "dealer_dealers", required:true},
    documentDate:{type:Date, required:true},
})
module.exports = mongoose.model("dealer_documents", dealer_documents)