const HeroSlideModel = require('../models/heroSlideModel');

const parseBool = (val) => {
  if (val === true || val === 'true' || val === '1' || val === 1) return 1;
  return 0;
};

const buildImageUrl = (req, filePath) => {
  if (!filePath) return null;
  // Cloudinary URLs are already full URLs
  if (filePath.startsWith('http')) return filePath;
  return filePath;
};

const HeroSlideService = {
  async getActiveSlides(req) {
    const slides = await HeroSlideModel.findAllActive();
    return slides.map((s) => ({
      ...s,
      image_url: buildImageUrl(req, s.image_url),
      background_image: buildImageUrl(req, s.background_image),
    }));
  },

  async getAllSlides(req) {
    const slides = await HeroSlideModel.findAll();
    return slides.map((s) => ({
      ...s,
      image_url: buildImageUrl(req, s.image_url),
      background_image: buildImageUrl(req, s.background_image),
    }));
  },

  async createSlide(req, body, files) {
    const imageFile = files?.image?.[0];
    const bgFile = files?.background_image?.[0];

    const data = {
      ...body,
      image_url: imageFile ? imageFile.path : (body.image_url || null),
      background_image: bgFile ? bgFile.path : (body.background_image || null),
      is_active: body.is_active !== undefined ? parseBool(body.is_active) : 1,
      order_index: Number(body.order_index) || 0,
    };

    const id = await HeroSlideModel.create(data);
    const slide = await HeroSlideModel.findById(id);
    return {
      ...slide,
      image_url: buildImageUrl(req, slide.image_url),
      background_image: buildImageUrl(req, slide.background_image),
    };
  },

  async updateSlide(req, id, body, files) {
    const existing = await HeroSlideModel.findById(id);
    if (!existing) return null;

    const imageFile = files?.image?.[0];
    const bgFile = files?.background_image?.[0];

    const data = {
      ...body,
      image_url: imageFile
        ? imageFile.path
        : (body.image_url !== undefined ? body.image_url : existing.image_url),
      background_image: bgFile
        ? bgFile.path
        : (body.background_image !== undefined ? body.background_image : existing.background_image),
      is_active: body.is_active !== undefined ? parseBool(body.is_active) : existing.is_active,
      order_index: body.order_index !== undefined ? Number(body.order_index) : existing.order_index,
    };

    await HeroSlideModel.update(id, data);
    const updated = await HeroSlideModel.findById(id);
    return {
      ...updated,
      image_url: buildImageUrl(req, updated.image_url),
      background_image: buildImageUrl(req, updated.background_image),
    };
  },

  async deleteSlide(id) {
    return HeroSlideModel.delete(id);
  },
};

module.exports = HeroSlideService;
