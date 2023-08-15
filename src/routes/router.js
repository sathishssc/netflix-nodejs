let express = require("express");
let serverRoute = express.Router();
let uploadData = require("../models/uploadmodel");
let multer = require("multer");
let bcrypt = require("bcrypt");
let RegisteUser = require("../models/register");
const jwt = require('jsonwebtoken');
require('dotenv').config();
let auth = require("../middleware/auth");
const ffmpeg = require('fluent-ffmpeg');

const User = require('../models/login');

serverRoute.post('/login', (req, res) => {
    const loginData = req.body;

    RegisteUser.findOne({email: loginData.email}).then( user => {
        // console.log(user);
        if(user) {
            bcrypt.compare(loginData.password, user.password).then(authStatus => {
                if(authStatus) { 
                    
                    const jwtToken = jwt.sign(
                        {
                            email: user.email,
                            name: user.name,
                            id: user._id
                        },
                        process.env.ENCRYPTION_SECRET, 
                        {
                            expiresIn: "1h"
                        },
                    )
                    console.log("passwords are matching");
                    res.status(200).json({
                        message: "Authentication successful!",
                        data: jwtToken,
                    });
                } else {
                    res.status(403).json({
                        errorDesc: "Email or password does not match"
                    });
                }
            }).catch(err => {
                res.status(500).json({
                    errorDesc: "Internal server error"
                });
            });
        } else {
            res.status(404).json({
                errorDesc: "Email id not registered with us!"
            });
        }

    }).catch(err => {
        res.status(500).json({
            errorDesc: "Something went wrong!",
            error: err
        });
    });
});

//getting user data

// serverRoute.get("/getUserData", auth, async(req,res) =>{
//     let userId = req.userId;
//         // console.log(userId);
//     try{
        
//         RegisteUser.find({_id:userId}).then(post =>{
//            res.status(200).json({
//             messege:"data fetched successfully",
//             data:post,
//            })
//         }).catch(err =>{
//             res.status(404).json({
//                 messege:"data not found",
//                 err:err,
//             })
//         })

//     }catch(err){
//         res.status(500).json({
//             message:'something went wrong',
//             err:err,
//         })
//     }
// })


//increment view count

serverRoute.put('/incrementViewCount/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const video = await uploadData.findById(id);
  
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
  
      video.viewCount += 1;
      await video.save();
  
      res.status(200).json({ message: 'View count incremented successfully' });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

//updating videodata
serverRoute.put("/update", auth, async (req,res) =>{
    // console.log(req.body)
    try{
      let id = req.body._id;
      const updatedData = await uploadData.findByIdAndUpdate(id, req.body)
      res.json({
        message: "Record updated successfully",
        data: updatedData });
    }catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({
        message: "Error updating record", 
        error: error.message 
    });
  }
})
//getting searching videos
serverRoute.get("/getPublicVideosSearch/:search", async (req, res) => {
    let search = req.params.search;
    console.log(search);

    try {
        uploadData.find({
            visibility: 'public',
            $or: [
                { name: { $regex: `.*${search}.*`, $options: 'i' } },
                { description: { $regex: `.*${search}.*`, $options: 'i' } },
                { category: { $regex: `.*${search}.*`, $options: 'i' } },
                { filePath: { $regex: `.*${search}.*`, $options: 'i' } }
            ]
        }).then(posts => {
                res.status(200).json({
                    message: "Data fetched successfully",
                    data: posts,
                });
        }).catch(err => {
            res.status(500).json({
                message: "Something went wrong",
                err: err,
            });
        });
    } catch (err) {
        res.status(500).json({
            message: 'Something went wrong',
            err: err,
        });
    }
});




//getting public videos
serverRoute.get("/getPublicVideos", async(req,res) =>{
    try{

        uploadData.find({ visibility: 'public' }).then(post =>{
           res.status(200).json({
            messege:"data fetched successfully",
            data:post,
           })
        }).catch(err =>{
            res.status(404).json({
                messege:"data not found",
                err:err,
            })
        })

    }catch(err){
        res.status(500).json({
            message:'something went wrong',
            err:err,
        })
    }
})


//for getting videos
serverRoute.use("/uploads", express.static('./uploads'));
serverRoute.get("/getVideos", auth, async(req,res) =>{
    let userId = req.userId;
    try{

        uploadData.find({ userId: userId }).then(post =>{
           res.status(200).json({
            messege:"data fetched successfully",
            data:post,
           })
        }).catch(err =>{
            res.status(404).json({
                messege:"data not found",
                err:err,
            })
        })

    }catch(err){
        res.status(500).json({
            message:'something went wrong',
            err:err,
        })
    }
})



//delete video

serverRoute.post("/deleteVideo", auth, async (req,res) =>{
       console.log(req.body.id)
try{
        let {id} = req.body;
        uploadData.findByIdAndDelete(id).then(response =>{
            res.status(200).json({
                message:"post deleted successfully",
                data:response
            })
        }).catch(err =>{
            res.status(404).json({
                message:"data not found",
                err:err,
            })
        })
}
catch(err){
        res.status(500).json({
            message:"something went wrong",
            err:err,
        })
}

})



//for upload videos
// const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
ffmpeg.setFfmpegPath(ffmpegPath);

serverRoute.use('/uploads', express.static('./uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage });

serverRoute.post('/upload',auth, upload.single('file'), async (req, res) => {
  const { name, description, category, visibility, other } = req.body;
  const filePath = req.file.path;
  let userId = req.userId;
  let userName = req.userName;

  const thumbnailFilename = `${path.parse(filePath).name}.jpg`;
  const thumbnailPath = path.join('uploads', thumbnailFilename);

  const generateThumbnail = () => {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime('00:00:05')
        .frames(1)
        .size('320x240')
        .output(thumbnailPath)
        .on('end', () => {
          console.log('Thumbnail generated successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          reject(err);
        })
        .run();
    });
  };

  try {
    await generateThumbnail();

    const newVideo = new uploadData({
      name: name,
      description: description,
      category: category,
      visibility: visibility,
      other: other,
      filePath: path.basename(filePath),
      thumbnailPath: path.basename(thumbnailPath),
      userName:userName,
      userId:userId
    });

    const savedVideo = await newVideo.save();
    res.status(200).json({
      message: 'Post creation successful',
      data: savedVideo,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error generating thumbnail or saving video',
      error: error.message,
    });
  }
});

// const mongoose = require("mongoose");
// const registerSchema = mongoose.Schema({
//     image:{bindata:Buffer},
//     name:{type:String,},
//     email:{type:String,unique:true},
//     phone:{type:Number,unique:true},
//     profession:{type:String,},
//     password:{type:String,}
// });
// const RegisteUser = mongoose.model('RegisterUseris',registerSchema);


serverRoute.post("/registering", (req, res) => {
    console.log("Request received")
    const userdata = req.body;
    console.log(userdata);
    bcrypt.hash(userdata.password, 10).then(encryptpassword => {
       console.log("Inside hash function");
       const userData = new RegisteUser({
        //    image: req.body.image,
           name: req.body.name,
           email: req.body.email,
           phone: req.body.phone,
           profession: req.body.profession,
           password: encryptpassword
       })
       userData.save().then(response => {
           res.status(201).json({
               status: "success",
               message: "successful Registered",
               data: response
           });
       })
           .catch(err => {
                console.error("Error in saving user data:", err);
               res.status(500).json({
                   status: "failed",
                   errorDesc: "data uploading failed",
                   error: err
               });
           })
   })
       .catch(err => {
           res.status(500).json({
               errorDesc: "Internal server error",
               error: err
           })
       })
});


module.exports = serverRoute;

