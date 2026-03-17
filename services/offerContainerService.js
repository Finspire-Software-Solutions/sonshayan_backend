const OfferContainerModel = require('../models/offerContainerModel');

const OfferContainerService = {
  async getContainers(activeOnly = false) {
    const containers = await OfferContainerModel.findAll({ activeOnly });
    // Attach products list to each container
    const result = await Promise.all(
      containers.map(async (c) => {
        const products = await OfferContainerModel.findProducts(c.id);
        return { ...c, products };
      })
    );
    return result;
  },

  async getContainerById(id) {
    const container = await OfferContainerModel.findById(id);
    if (!container) throw { status: 404, message: 'Offer container not found.' };
    const products = await OfferContainerModel.findProducts(id);
    return { ...container, products };
  },

  async createContainer(data) {
    const id = await OfferContainerModel.create({
      name: data.name,
      discount_percent: parseFloat(data.discount_percent) || 0,
      max_items: parseInt(data.max_items) || 5,
      is_active: data.is_active !== undefined ? parseInt(data.is_active) : 1,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    });

    // Attach products if provided
    if (Array.isArray(data.product_ids) && data.product_ids.length > 0) {
      await OfferContainerModel.setProducts(id, data.product_ids.map(Number));
    }

    return this.getContainerById(id);
  },

  async updateContainer(id, data) {
    const container = await OfferContainerModel.findById(id);
    if (!container) throw { status: 404, message: 'Offer container not found.' };

    await OfferContainerModel.update(id, {
      name: data.name || container.name,
      discount_percent: data.discount_percent !== undefined ? parseFloat(data.discount_percent) : container.discount_percent,
      max_items: data.max_items !== undefined ? parseInt(data.max_items) : container.max_items,
      is_active: data.is_active !== undefined ? parseInt(data.is_active) : container.is_active,
      start_date: data.start_date !== undefined ? data.start_date || null : container.start_date,
      end_date: data.end_date !== undefined ? data.end_date || null : container.end_date,
    });

    if (Array.isArray(data.product_ids)) {
      await OfferContainerModel.setProducts(id, data.product_ids.map(Number));
    }

    return this.getContainerById(id);
  },

  async deleteContainer(id) {
    const container = await OfferContainerModel.findById(id);
    if (!container) throw { status: 404, message: 'Offer container not found.' };
    await OfferContainerModel.delete(id);
  },

  /**
   * Validate adding a product to an offer container (cart-side check).
   * Returns the container info + discount preview.
   */
  async validateForCart(containerId, productId, price) {
    const container = await OfferContainerModel.findById(containerId);
    if (!container || !container.is_active) {
      throw { status: 400, message: 'Offer container is not available.' };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (container.start_date && container.start_date > today) {
      throw { status: 400, message: 'Offer has not started yet.' };
    }
    if (container.end_date && container.end_date < today) {
      throw { status: 400, message: 'Offer has expired.' };
    }

    const eligible = await OfferContainerModel.isProductEligible(containerId, productId);
    if (!eligible) {
      throw { status: 400, message: 'This product is not eligible for this offer.' };
    }

    const discount = parseFloat((price * (container.discount_percent / 100)).toFixed(2));
    return {
      container_id: container.id,
      container_name: container.name,
      discount_percent: container.discount_percent,
      max_items: container.max_items,
      discount_amount: discount,
      final_price: parseFloat((price - discount).toFixed(2)),
    };
  },
};

module.exports = OfferContainerService;
