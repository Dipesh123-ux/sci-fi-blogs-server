const Tag = require("../models/tag");
const Blog = require('../models/blog')
const slugify = require("slugify");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.createTag = (req, res) => {
  const { name } = req.body;

  let slug = slugify(name).toLowerCase();

  const tag = new Tag({ name, slug });

  tag.save((err, data) => {
    if (err) {
      return res.status(404).json({
        error: "tag already exists please use another name",
      });
    }

    res.json(data);
  });
};

exports.listTags = (req, res) => {
  Tag.find({}).then((data, err) => {
    if (err) {
      return res.status(404).json({
        error: errorHandler(err),
      });
    }

    res.json(data);
  });
};

exports.readTag = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Tag.findOne({ slug }).then((tag, err) => {
    if (err) {
      return res.status(404).json({
        error: "Tag not found"
      });
    }

    Blog.find({ tags: tag })
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
        res.json({ tag: tag, blogs: data });
    });
  });
};

exports.deleteTag = (req, res) => {
  const slug = req.params.slug;

  Tag.findOneAndRemove({ slug }).then((tag, err) => {
    if (err) {
      return res.status(404).json({
        error: err,
      });
    }
     res.json({
      message: "tag successfully deleted !",
    });
  });
};

