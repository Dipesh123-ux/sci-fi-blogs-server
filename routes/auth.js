const express =  require('express');

const router =  express.Router();

const authController =  require('../controllers/auth');
const {requireSignin,googleLogin} =  require('../controllers/auth');

//validators 

const {runValidation} = require('../validators/index')
const {userSignupValidator} = require('../validators/auth')
const {userSigninValidator} = require('../validators/auth')

router.post('/signup',userSignupValidator,runValidation,authController.signUp);
router.post('/signin',userSigninValidator,runValidation,authController.signIn);
router.get('/signout',authController.signOut);

//GOOGLE LOGIN

router.post('/google/login',googleLogin);


module.exports = router;