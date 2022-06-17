const User = require('../models/user');
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt')
const Blog = require("../models/blog")
const _ = require('lodash');
const nodemailer = require('nodemailer')
// const {OAuth2Client} = require('google-auth-library')






exports.preSignUp = (req, res)=>{
    const {name,email,password} = req.body 
    User.findOne({email : email.toLowerCase()},(err,user)=>{
        if(user){
            return res.status(400).json({
                error : "user with that email already exist"
            })
        }

        const token  = jwt.sign({name,email,password},process.env.JWT_SIGNUP_SECRET,{expiresIn  :"10m"})
        
        const transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
              user: process.env.USER,
              pass : process.env.PASS,
            },
            tls:{
                rejectUnauthorized : false
            }
          });

               transporter.sendMail({
                from: process.env.USER,
                to: email,
                subject: 'Account Activation Link',
                html: `<h2>Welcome to sci-fi-blogs</h2>
                        <h4>Use this link to verify your email</h4>
                        <a href="https://sci-fi-blogs.vercel.app/auth/account/activate/${token}" >account activation link</a>
                        <br />
                        <h4>Have a great blogging experience</h4>
                     `,
              })
              .then(()=>{
                return res.status(200).json({
                    message : `Email has been sent to ${email}. Follow the instructions to activate your account`
                })
              })
              .catch( (error) =>{

              console.log(error);
              return res.status(400).json({
                error : 'email not sent'
              })
            }
              );


    })
}


exports.signUp = (req, res) => {
    const token = req.body.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SIGNUP_SECRET, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Signup again'
                });
            }

            const { name, email, password } = jwt.decode(token);

            let username = shortId.generate();
            let profile = `https://sci-fi-blogs.vercel.app/profile/${username}`;

            const user = new User({ name, email, password, profile, username });
            user.save((err, user) => {
                if (err) {
                    return res.status(401).json({
                        error: errorHandler(err)
                    });
                }
                return res.json({
                    message: 'Singup success! Please signin'
                });
            });
        });
    } else {
        return res.json({
            message: 'Something went wrong. Try again'
        });
    }
};

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


exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

        // email
        // populating the db > user > resetPasswordLink


      
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ error: errorHandler(err) });
            } else {
                   const transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
              user: process.env.USER,
              pass : process.env.PASS,
            },
            tls:{
                rejectUnauthorized : false
            }
          });
                transporter.sendMail({
                    from: process.env.USER,
                    to: email,
                    subject: 'Password Reset Link',
                    html: ` <a href="https://sci-fi-blogs.vercel.app/auth/password/reset/${token}">Password reset link</a>
                            <hr/>
                            <p>This email may contain sensetive information</p>
                         `,
                  })
                  .then(()=>{
                    return res.status(200).json({
                        message : `Email has been sent to ${email}. Follow the instructions to activate your account`
                    })
                  })
                  .catch( (error) =>{
    
                  console.log(error);
                  return res.status(400).json({
                    error : 'email not sent'
                  })
                }
                  );
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Try again'
                });
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Something went wrong. Try later'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }
                    return res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
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