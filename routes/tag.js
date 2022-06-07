const express = require("express");

const router = express.Router();


const {requireSignin, adminMiddleware} =  require('../controllers/auth')

const { createTag ,listTags ,readTag ,deleteTag} = require("../controllers/tag");

const { runValidation } = require("../validators");
const { tagValidator } = require("../validators/tag");

router.post("/tag",tagValidator,runValidation, requireSignin, adminMiddleware, createTag);
router.get('/tags',listTags);
router.get('/tag/:slug',readTag)
router.delete('/tag/:slug',requireSignin, adminMiddleware,deleteTag);

module.exports = router;