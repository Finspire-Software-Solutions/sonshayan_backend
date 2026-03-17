const ComboService = require('../services/comboService');

const comboController = {
  async getAll(req, res, next) {
    try {
      const combos = await ComboService.getCombos();
      res.json({ success: true, data: combos });
    } catch (err) {
      next(err);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const combos = await ComboService.getCombosAdmin();
      res.json({ success: true, data: combos });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const combo = await ComboService.getComboById(req.params.id);
      res.json({ success: true, data: combo });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const combo = await ComboService.createCombo(req.body, req.files);
      res.status(201).json({ success: true, data: combo, message: 'Combo created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const combo = await ComboService.updateCombo(req.params.id, req.body, req.files);
      res.json({ success: true, data: combo, message: 'Combo updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await ComboService.deleteCombo(req.params.id);
      res.json({ success: true, message: 'Combo deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = comboController;
