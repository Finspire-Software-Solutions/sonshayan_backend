const fs = require('fs');
const path = require('path');
const ComboModel = require('../models/comboModel');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

const ComboService = {
  async getCombos() {
    return ComboModel.findAll({ activeOnly: true });
  },

  async getCombosAdmin() {
    return ComboModel.findAll({ activeOnly: false });
  },

  async getComboById(id) {
    const combo = await ComboModel.findById(id);
    if (!combo) throw { status: 404, message: 'Combo not found.' };
    return combo;
  },

  async createCombo(data, files) {
    const imageFile = files?.combo_image?.[0];
    const image = imageFile ? imageFile.path.replace(/\\/g, '/') : null;

    const comboId = await ComboModel.create({
      name: data.name,
      description: data.description || null,
      price: parseFloat(data.price),
      image,
      is_active: data.is_active !== 'false' && data.is_active !== false ? 1 : 0,
    });

    // Parse and save combo items
    let items = [];
    try {
      items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [];
    } catch (_) {
      items = [];
    }

    for (const item of items) {
      await ComboModel.addItem(comboId, {
        product_id: item.product_id || null,
        product_name: item.product_name || item.name || '',
      });
    }

    return ComboModel.findById(comboId);
  },

  async updateCombo(id, data, files) {
    const combo = await ComboModel.findById(id);
    if (!combo) throw { status: 404, message: 'Combo not found.' };

    let image = combo.image;
    if (files?.combo_image?.[0]) {
      deleteFile(combo.image);
      image = files.combo_image[0].path.replace(/\\/g, '/');
    }

    await ComboModel.update(id, {
      name: data.name,
      description: data.description || null,
      price: parseFloat(data.price),
      image,
      is_active: data.is_active !== 'false' && data.is_active !== false ? 1 : 0,
    });

    // Replace items
    await ComboModel.deleteItems(id);
    let items = [];
    try {
      items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [];
    } catch (_) {
      items = [];
    }

    for (const item of items) {
      await ComboModel.addItem(id, {
        product_id: item.product_id || null,
        product_name: item.product_name || item.name || '',
      });
    }

    return ComboModel.findById(id);
  },

  async deleteCombo(id) {
    const combo = await ComboModel.findById(id);
    if (!combo) throw { status: 404, message: 'Combo not found.' };
    deleteFile(combo.image);
    await ComboModel.delete(id);
  },
};

module.exports = ComboService;
