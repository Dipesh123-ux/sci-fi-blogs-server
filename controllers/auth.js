const User = require('../models/user');
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt')
const Blog = require("../models/blog")
const _ = require('lodash');
// const {OAuth2Client} = require('google-auth-library')




exports.signUp = (req,res,next) => {
  
  User.findOne({email : req.body.email}).exec((err, user) => {
        if(user) {
            return res.status(400).json({
                error : "Email already taken"
            })
        }

        const {name , email , password} = req.body;

        let username = shortId.generate()
        let profile = `${process.env.CLIENT_URL}/profile/${username}`
        let newUser = new User({
            name , email , password , profile,username
        })

        newUser.save((err,success) => {
            if(err) {
                return res.status(400).json({
                    error : err
                })
            }

            res.json({
                message : "Signup success !"
            })
        })

  })
}

exports.signIn = (req,res,next) =>{

    const {email , password } = req.body;
    //check if user exist 
  User.findOne({email}).exec((err, user)=>{
      if(err || !user){
          return res.status(400).json({
              error : "User with that email does not exist please signUp"
          })
      }
      // authenticate 

      if(!user.authenticate(password)){
        return res.status(400).json({
            error : "Please enter the correct password"
        }) 
      }

      // generate  a jwt and send to client 
      const token  = jwt.sign({_id : user._id},process.env.JWT_SECRET,{expiresIn  :"1d"})

      res.cookie('token',token,{expiresIn : '1d'})

      const {_id,username , name,email,role,photo,about} = user

      return res.json({
          token,
          user : {_id,username , name,email,role,photo,about},
          message : "signIn successful"
      })


  })

    


    
}

exports.signOut = (req,res,next)=>{
    res.clearCookie('token');
    res.json({
        message : 'Sign out Success',
    })
}

exports.requireSignin = expressJwt({
    secret : process.env.JWT_SECRET,
    algorithms: ['sha1', 'RS256', 'HS256'],
})  

exports.authMiddleware  = (req,res,next) =>{
    const authUserId = req.user._id;
    User.findById({_id : authUserId}).then(user=>{
          if(!user){
              return res.status(404).json({
                  error : "User not found"
              })
          }

          req.profile = user

          next();
    })
}

exports.adminMiddleware = (req,res,next) =>{
    const adminUserId = req.user._id;
    User.findById({_id : adminUserId}).then(user=>{
        if(!user){
            return res.status(404).json({
                error : "User not found"
            })
        }
  if(user.role !== 1){
      return res.status(404).json({
          error : "Admin resource. Access deniend not found"
      })
  }

  req.profile = user

  next();

})

}

exports.canUpdateDeleteBlog = (req, res, next) => {
    const slug = req.params.slug.toLowerCase();
    Blog.findOne({ slug }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();
        if (!authorizedUser) {
            return res.status(400).json({
                error: 'You are not authorized'
            });
        }
        next();
    });
};

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// exports.googleLogin = (req,res,next)=>{
//     const idToken = req.body.tokenId;
//     client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }).then(response => {
//         // console.log(response)
//         const { email_verified, name, email, jti } = response.payload;
//         if (email_verified) {
//             User.findOne({ email }).exec((err, user) => {
//                 if (user) {
//                     // console.log(user)
//                     const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
//                     res.cookie('token', token, { expiresIn: '1d' });
//                     const { _id, email, name, role, username } = user;
//                     return res.json({ token, user: { _id, email, name, role, username } });
//                 } else {
//                     let username = shortId.generate();
//                     let profile = `${process.env.CLIENT_URL}/profile/${username}`;
//                     let password = jti;
//                     user = new User({ name, email, profile, username, password });
//                     user.save((err, data) => {
//                         if (err) {
//                             return res.status(400).json({
//                                 error: errorHandler(err)
//                             });
//                         }
//                         const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
//                         res.cookie('token', token, { expiresIn: '1d' });
//                         const { _id, email, name, role, username } = data;
//                         return res.json({ token, user: { _id, email, name, role, username } });
//                     });
//                 }
//             });
//         } else {
//             return res.status(400).json({
//                 error: 'Google login failed. Try again.'
//             });
//         }
//     });
// }