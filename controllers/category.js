const Category = require('../models/category')
const slugify = require('slugify')
const Blog = require('../models/blog')
const {errorHandler} = require('../helpers/dbErrorHandler')


exports.create = (req,res)=>{
    const {name} = req.body

    let slug = slugify(name).toLowerCase()

    const category = new Category({name,slug})

    category.save((err,data)=>{
        if(err){
            return res.status(404).json({
                error : "category already exists please use another name"
            })
        }

        res.json(data)
    })
 }

 exports.list = (req,res)=>{

    Category.find({}).then((data,err)=>{
       if(err){
           return res.status(404).json({
               error : errorHandler(err)
           })
       }

       res.json(data)
    })


 }

 exports.read = (req, res) => {
    const slug = req.params.slug.toLowerCase();

    Category.findOne({ slug }).exec((err, category) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        // res.json(category);
        Blog.find({ categories: category })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name')
            .select('_id title slug excerpt categories postedBy tags createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json({ category: category, blogs: data });
            });
    });
 }

 exports.deleteCat = (req, res) => {
     const slug = req.params.slug

     Category.findOneAndRemove({slug}).then((err, category)=>{
         if(err){
             return res.status(404).json({
                 error : err
             })

         }

         res.json({
             message : "category successfully deleted !"
         })
     })
 }