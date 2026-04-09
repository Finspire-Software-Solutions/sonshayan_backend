const slugify = require('slugify');
const BlogModel = require('../models/blogModel');

const generateSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true }) +
  '-' +
  Date.now().toString().slice(-5);

const BlogService = {
  async getBlogs(query) {
    return BlogModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 9,
      publishedOnly: true,
    });
  },

  async getBlogsAdmin(query) {
    return BlogModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 15,
      publishedOnly: false,
    });
  },

  async getBlogById(id) {
    const blog = await BlogModel.findById(id);
    if (!blog) throw { status: 404, message: 'Blog not found.' };
    return blog;
  },

  async getBlogBySlug(slug) {
    const blog = await BlogModel.findBySlug(slug);
    if (!blog) throw { status: 404, message: 'Blog not found.' };
    return blog;
  },

  async createBlog(data, file) {
    const slug = generateSlug(data.title);
    const thumbnail = file ? file.path.replace(/\\/g, '/') : null;

    const id = await BlogModel.create({
      title: data.title,
      slug,
      thumbnail,
      content: data.content,
      author: data.author || 'Son Shayan Team',
    });

    return BlogModel.findById(id);
  },

  async updateBlog(id, data, file) {
    const blog = await BlogModel.findById(id);
    if (!blog) throw { status: 404, message: 'Blog not found.' };

    const slug = data.title !== blog.title ? generateSlug(data.title) : blog.slug;
    const thumbnail = file ? file.path.replace(/\\/g, '/') : blog.thumbnail;

    await BlogModel.update(id, {
      title: data.title,
      slug,
      thumbnail,
      content: data.content,
      author: data.author || blog.author,
      is_published: data.is_published !== undefined ? data.is_published : blog.is_published,
    });

    return BlogModel.findById(id);
  },

  async deleteBlog(id) {
    const blog = await BlogModel.findById(id);
    if (!blog) throw { status: 404, message: 'Blog not found.' };
    await BlogModel.delete(id);
  },
};

module.exports = BlogService;
