// server.js
let express = require("express");
let mongoose = require("mongoose");
let dotenv = require('dotenv').config()
let app = express();

let cors = require("cors");
app.use(cors());

let serverRoute = require("./src/routes/router");
// let signinRoute = require("./src/routes/signin");
let bodyparser = require("body-parser");

app.use(bodyparser.json());

app.use("/",serverRoute)

// app.use("/signin", signinRoute)

mongoose.connect(process.env.mongoDB)
.then(() =>{
    console.log("mongoDB connected successfully");
})
.catch(() => {
    console.log("mongoDB connecting failed")
});


app.listen(process.env.PORT, () => console.log("server running on port "+process.env.PORT))

