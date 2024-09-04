const mongoose = require("mongoose");

const dealer_roles = mongoose.Schema({
    name:String,
})

module.exports = mongoose.model("dealer_roles", dealer_roles)