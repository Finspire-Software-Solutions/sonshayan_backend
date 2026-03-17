const OfferContainerService = require('../services/offerContainerService');

const offerContainerController = {
  async getAll(req, res, next) {
    try {
      const activeOnly = req.query.active === 'true';
      const containers = await OfferContainerService.getContainers(activeOnly);
      res.json({ success: true, data: containers });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const container = await OfferContainerService.getContainerById(req.params.id);
      res.json({ success: true, data: container });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const container = await OfferContainerService.createContainer(req.body);
      res.status(201).json({ success: true, data: container, message: 'Offer container created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const container = await OfferContainerService.updateContainer(req.params.id, req.body);
      res.json({ success: true, data: container, message: 'Offer container updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await OfferContainerService.deleteContainer(req.params.id);
      res.json({ success: true, message: 'Offer container deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async validateForCart(req, res, next) {
    try {
      const { container_id, product_id, price } = req.body;
      if (!container_id || !product_id || price === undefined) {
        return res.status(400).json({ success: false, error: 'container_id, product_id and price are required.' });
      }
      const result = await OfferContainerService.validateForCart(container_id, product_id, parseFloat(price));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = offerContainerController;
