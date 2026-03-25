const HeroSlideService = require('../services/heroSlideService');

const heroSlideController = {
  // GET /api/hero-slides — public, active slides only
  async getActive(req, res) {
    try {
      const slides = await HeroSlideService.getActiveSlides(req);
      res.json({ success: true, data: slides });
    } catch (err) {
      console.error('heroSlide.getActive:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch hero slides.' });
    }
  },

  // GET /api/hero-slides/admin/all — admin
  async getAll(req, res) {
    try {
      const slides = await HeroSlideService.getAllSlides(req);
      res.json({ success: true, data: slides });
    } catch (err) {
      console.error('heroSlide.getAll:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch hero slides.' });
    }
  },

  // POST /api/hero-slides — admin
  async create(req, res) {
    try {
      if (!req.body.title) {
        return res.status(400).json({ success: false, error: 'Title is required.' });
      }
      const slide = await HeroSlideService.createSlide(req, req.body, req.files);
      res.status(201).json({ success: true, data: slide });
    } catch (err) {
      console.error('heroSlide.create:', err);
      res.status(500).json({ success: false, error: 'Failed to create hero slide.' });
    }
  },

  // PUT /api/hero-slides/:id — admin
  async update(req, res) {
    try {
      const slide = await HeroSlideService.updateSlide(req, req.params.id, req.body, req.files);
      if (!slide) return res.status(404).json({ success: false, error: 'Slide not found.' });
      res.json({ success: true, data: slide });
    } catch (err) {
      console.error('heroSlide.update:', err);
      res.status(500).json({ success: false, error: 'Failed to update hero slide.' });
    }
  },

  // DELETE /api/hero-slides/:id — admin
  async delete(req, res) {
    try {
      const affected = await HeroSlideService.deleteSlide(req.params.id);
      if (!affected) return res.status(404).json({ success: false, error: 'Slide not found.' });
      res.json({ success: true, message: 'Slide deleted.' });
    } catch (err) {
      console.error('heroSlide.delete:', err);
      res.status(500).json({ success: false, error: 'Failed to delete hero slide.' });
    }
  },
};

module.exports = heroSlideController;
