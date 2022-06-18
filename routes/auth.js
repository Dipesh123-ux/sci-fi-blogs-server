const express =  require('express');

const router =  express.Router();

const authController =  require('../controllers/auth');
const {requireSignin} =  require('../controllers/auth');

//validators 

const {runValidation} = require('../validators/index')
const {
    userSignupValidator,
    userSigninValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../validators/auth');

router.post('/pre-signup',userSignupValidator,runValidation,authController.preSignUp);
router.post('/signup',authController.signUp);
router.post('/signin',userSigninValidator,runValidation,authController.signIn);
router.get('/signout',authController.signOut);
router.put('/forgot-password', forgotPasswordValidator, runValidation, authController.forgotPassword);
router.put('/reset-password', resetPasswordValidator, runValidation, authController.resetPassword);


router.post('/google-login', authController.googleLogin);



module.exports = router;