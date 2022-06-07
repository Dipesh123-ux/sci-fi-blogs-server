const express = require("express");

const router = express.Router();


const {requireSignin, adminMiddleware} =  require('../controllers/auth')

const { create ,list ,read,deleteCat} = require("../controllers/category");

const { runValidation } = require("../validators");
const { categoryCreateValidator } = require("../validators/category");

router.post("/category",categoryCreateValidator,runValidation, requireSignin, adminMiddleware, create);
router.get('/categories',list);
router.get('/category/:slug',read);
router.delete('/category/:slug',requireSignin, adminMiddleware,deleteCat);

module.exports = router;
