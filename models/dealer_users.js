const mongoose = require("mongoose");

const dealer_users= mongoose.Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    phone:String,
    email:{type:String, required:true},
    password:{type:String, required:true},
    userCode:{type:String, required:true},
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dealer_roles', required:true }]
})
module.exports = mongoose.model("dealer_users", dealer_users)