let express = require("express");
let mongoose = require("mongoose");

let data = mongoose.Schema({
  name:{type:String},
  description: {type:String},
  category: {type:String},
  visibility: {type:String},
  other: {type:String},
  filePath: {type:String},
  thumbnailPath: {type:String},
  userName:{type:String},
  viewCount: { type: Number, default: 0 },
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'uploadData',}
})

let uploadData = mongoose.model("uploadData", data);

module.exports = uploadData