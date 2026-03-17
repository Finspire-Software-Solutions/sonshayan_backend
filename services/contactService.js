const ContactModel = require('../models/contactModel');

const ContactService = {
  async getContacts(query) {
    return ContactModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
    });
  },

  async submitContact({ name, email, phone, message }) {
    const id = await ContactModel.create({ name, email, phone, message });
    return { id, message: 'Thank you for contacting us! We will get back to you soon.' };
  },

  async markRead(id) {
    await ContactModel.markRead(id);
  },

  async deleteContact(id) {
    await ContactModel.delete(id);
  },
};

module.exports = ContactService;
