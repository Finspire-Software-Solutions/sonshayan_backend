const BlogService = require('../services/blogService');

const blogController = {
  async getAll(req, res, next) {
    try {
      const result = await BlogService.getBlogs(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const result = await BlogService.getBlogsAdmin(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const blog = await BlogService.getBlogById(req.params.id);
      res.json({ success: true, data: blog });
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const blog = await BlogService.getBlogBySlug(req.params.slug);
      res.json({ success: true, data: blog });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const blog = await BlogService.createBlog(req.body, req.file);
      res.status(201).json({ success: true, data: blog, message: 'Blog created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const blog = await BlogService.updateBlog(req.params.id, req.body, req.file);
      res.json({ success: true, data: blog, message: 'Blog updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await BlogService.deleteBlog(req.params.id);
      res.json({ success: true, message: 'Blog deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = blogController;
