const express =  require('express');

const router =  express.Router();

const authController =  require('../controllers/auth');
const {requireSignin} =  require('../controllers/auth');

//validators 

const {runValidation} = require('../validators/index')
const {userSignupValidator} = require('../validators/auth')
const {userSigninValidator} = require('../validators/auth')

router.post('/pre-signup',userSignupValidator,runValidation,authController.preSignUp);
router.post('/signup',authController.signUp);
router.post('/signin',userSigninValidator,runValidation,authController.signIn);
router.get('/signout',authController.signOut);




module.exports = router;