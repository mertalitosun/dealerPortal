const mongoose = require('mongoose');

const dealer_password_reset = new mongoose.Schema({
    email: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

module.exports = mongoose.model('dealer_password_reset', dealer_password_reset);
