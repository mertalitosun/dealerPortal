const mongoose = require('mongoose');
const Roles = require('../models/dealer_roles'); 
const Users = require('../models/dealer_users'); 
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const initializeDatabase = async (req,res) => {
    try{
        const adminRole = new Roles({ name: 'admin' });
        const dealerRole = new Roles({ name: 'dealer' });

        await adminRole.save();
        await dealerRole.save();

        const user1 = new Users({
            firstName: 'mertali',
            lastName: 'tosun',
            phone: '11111111',
            email: 'mertali2635@icloud.com',
            password: await bcrypt.hash("123456",10), 
            userCode: `USR-${shortid.generate()}`,
            roles: [adminRole._id]
        });

        
        
        await user1.save();
    }catch(err){
        console.log(err)
    }
}

module.exports = initializeDatabase;