// src/models/register.js
const mongoose = require("mongoose");

const registerSchema = mongoose.Schema({
    image:{bindata:Buffer},
    name:{type:String,},
    email:{type:String,unique:true},
    phone:{type:Number,},
    profession:{type:String,},
    password:{type:String,}
});

const RegisteUser = mongoose.model('RegisterUser',registerSchema);
module.exports = RegisteUser;