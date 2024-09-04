const mongoose = require("mongoose");

const dealer_integrator = mongoose.Schema({
    name:String
})
module.exports = mongoose.model("dealer_integrator", dealer_integrator)