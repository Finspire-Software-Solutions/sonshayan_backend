const ContactService = require('../services/contactService');

const contactController = {
  async getAll(req, res, next) {
    try {
      const result = await ContactService.getContacts(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async submit(req, res, next) {
    try {
      const result = await ContactService.submitContact(req.body);
      res.status(201).json({ success: true, data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req, res, next) {
    try {
      await ContactService.markRead(req.params.id);
      res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await ContactService.deleteContact(req.params.id);
      res.json({ success: true, message: 'Contact deleted.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = contactController;
