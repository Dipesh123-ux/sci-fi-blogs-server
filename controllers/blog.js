const Blog = require("../models/blog");
const Category = require("../models/category");
const Tag = require("../models/tag");
const formidable = require("formidable");
const slugify = require("slugify");
const { stripHtml } = require("string-strip-html");
const _ = require("lodash");
const fs = require("fs");
const { smartTrim } = require("../helpers/blog");
const User = require("../models/user")

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        err: "Image could not uploaded",
      });
    }

    const { title, body, categories, tags } = fields;

    if (!title || !title.length) {
      return res.status(400).json({
        error: "title is required",
      });
    }

    if (!body || body.length < 50) {
      return res.status(400).json({
        error: "Content is too short",
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        error: "At least one category is required",
      });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({
        error: "At least one tag is required",
      });
    }

    if(!files || !files.photo){
      return res.status(400).json({
        error: "featured Image required",
      });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excerpt = smartTrim(body, 180, " ", " ...");
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title} | ${process.env.APP_NAME}`;
    blog.mdesc = body.substring(0, 160);
    blog.postedBy = req.user._id;

    let arrayOfCategories = categories ? categories.split(",") : [];
    let arrayOfTags = tags ? tags.split(",") : [];

    if (files.photo) {
      if (files.photo.size > 20000000) {
        return res.status(400).json({
          error: "Image size should be less than 2 mb",
        });
      }

      blog.photo.data = fs.readFileSync(files.photo.filepath);
      blog.photo.contentType = files.photo.mimetype;
    }

    blog.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }

      Blog.findByIdAndUpdate(
        result._id,
        { $push: { categories: arrayOfCategories } },
        { new: true }
      ).exec((err, result) => {
        if (err) {
          return res.status(400).json({
            error: err,
          });
        } else {
          Blog.findByIdAndUpdate(
            result._id,
            { $push: { tags: arrayOfTags } },
            { new: true }
          ).exec((err, result) => {
            if (err) {
              return res.status(400).json({
                error: err,
              });
            } else {
              return res.status(200).json({
                result: result,
                message: "success",
              });
            }
          });
        }
      });
    });
  });
};

exports.list = (req, res, next) => {
  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: err,
        });
      }

      res.json({
        blogs: data,
      });
    });
};

exports.listAllBlogsCatAndTag = (req, res, next) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10

  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

let blogs ,categories,tags;

  Blog.find({})
  .populate("categories", "_id name slug")
  .populate("tags", "_id name slug")
  .populate("postedBy", "_id name username profile")
  .sort({createdAt : -1})
  .skip(skip)
  .limit(limit)
  .select(
    "_id title slug excerpt categories tags postedBy createdAt updatedAt"
  )
  .exec((err,data)=>{
    if(err){
      return res.status(400).json({
        error : err
      })
    }

    blogs = data;

    Category.find({}).exec((err,c)=>{
      if(err){
        return res.status(400).json({
          error : err
        })
      }

      categories = c;

      Tag.find({}).exec((err,t)=>{
        if(err){
          return res.status(400).json({
            error : err
          })
        }
  
        tags = t;

        res.json({blogs , categories,tags,size : blogs.length})
      })

    })




  })
};

exports.read = (req, res, next) => {
  const slug = req.params.slug.toLowerCase()

  Blog.findOne({slug})
  .populate("categories", "_id name slug")
  .populate("tags", "_id name slug")
  .populate("postedBy", "_id name username")
  .select(
    "_id title body slug excerpt mdesc mtitle categories tags postedBy createdAt updatedAt"
  )
  .exec((err,data)=>{
    if(err){
      return res.status(400).json({
        error : err
      })
    }
    res.json(data)
  })
};


exports.remove = (req, res, next) => {
  const slug = req.params.slug.toLowerCase()

  Blog.findOneAndRemove({slug}).exec((err, data)=>{
    if(err){
      return res.status(400).json({
        error : err
      })
    }
    res.status(200).json(
      { 
        message : 'blog successfully deleted'
      }
    )
  })
};

exports.update = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

    Blog.findOne({ slug }).exec((err, oldBlog) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }

        let form = new formidable.IncomingForm();
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    error: 'Image could not upload'
                });
            }

            let slugBeforeMerge = oldBlog.slug;
            oldBlog = _.merge(oldBlog, fields);
            oldBlog.slug = slugBeforeMerge;

            const { body, desc, categories, tags } = fields;

            if (body) {
                oldBlog.excerpt = smartTrim(body, 320, ' ', ' ...');
                oldBlog.desc =body.substring(0, 160);
            }

            if (categories) {
                oldBlog.categories = categories.split(',');
            }

            if (tags) {
                oldBlog.tags = tags.split(',');
            }

            if (files.photo) {
                if (files.photo.size > 20000000) {
                    return res.status(400).json({
                        error: 'Image should be less then 2mb in size'
                    });
                }
                oldBlog.photo.data = fs.readFileSync(files.photo.filepath);
                oldBlog.photo.contentType = files.photo.type;
            }

            oldBlog.save((err, result) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                // result.photo = undefined;
                res.json(result);
            });
        });

    });
};

exports.photo = (req, res, next) => {
  const slug = req.params.slug.toLowerCase()

  Blog.find({slug})
  .select('photo')
  .exec((err,blog)=>{
    if(err){
      return res.status(400).json({
        error : err
      })
    }
    if(blog){
    res.set('Content-Type',blog[0].photo.contentType)
    return res.send(blog[0].photo.data)
    }
  })
}


exports.listRelated = (req, res) => {
  // console.log(req.body.blog);
  let limit = req.body.limit ? parseInt(req.body.limit) : 3;
  const { _id, categories } = req.body.blog;

  Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
      .limit(limit)
      .populate('postedBy', '_id name profile username')
      .select('photo title slug excerpt postedBy createdAt updatedAt')
      .exec((err, blogs) => {
          if (err) {
              return res.status(400).json({
                  error: 'Blogs not found'
              });
          }
          res.json(blogs);
      });
};

exports.listSearch = (req, res) => {
  console.log(req);
  const { search } = req.query;
  if (search) {
      Blog.find(
          {
              $or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }]
          },
          (err, blogs) => {
              if (err) {
                  return res.status(400).json({
                      error: err
                  });
              }
              res.json(blogs);
          }
      ).select('-photo -body');
  }
};

exports.listByUser = (req, res) => {
  let username = req.params.username; 
  console.log(username)
  User.findOne({ username: username }).exec((err, user) => {
      if (err) {
          return res.status(400).json({
              error: errorHandler(err)
          });
      }
      let userId = user._id;
      Blog.find({ postedBy: userId })
          .populate('categories', '_id name slug')
          .populate('tags', '_id name slug')
          .populate('postedBy', '_id name username')
          .select('_id title slug postedBy createdAt updatedAt')
          .exec((err, blogs) => {
              if (err) {
                  return res.status(400).json({
                      error: err
                  });
              }
              res.json(blogs);
          });
  });
};

