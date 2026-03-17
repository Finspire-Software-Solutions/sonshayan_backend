/**
 * Delivery fee calculation service using the Haversine formula.
 *
 * Business rules (Kilinochchi area):
 *  - Free delivery within FREE_RADIUS_KM (5 km)
 *  - Outside free radius: base_fee + extra_per_km * (distance - FREE_RADIUS_KM)
 */

// Base location: Kilinochchi town centre
const BASE_LAT = parseFloat(process.env.DELIVERY_BASE_LAT) || 9.3803;
const BASE_LNG = parseFloat(process.env.DELIVERY_BASE_LNG) || 80.4047;

// Delivery fee settings (override via env for easy admin customisation)
const FREE_RADIUS_KM = parseFloat(process.env.DELIVERY_FREE_RADIUS_KM) || 5;
const BASE_FEE      = parseFloat(process.env.DELIVERY_BASE_FEE)       || 200;
const EXTRA_PER_KM  = parseFloat(process.env.DELIVERY_EXTRA_PER_KM)   || 50;

/**
 * Haversine formula – returns distance in kilometres between two geo-coordinates.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate delivery fee given customer's coordinates.
 * @param {number} customerLat
 * @param {number} customerLng
 * @returns {{ distanceKm: number, fee: number, isFree: boolean }}
 */
function calculateDeliveryFee(customerLat, customerLng) {
  const distanceKm = parseFloat(haversineKm(BASE_LAT, BASE_LNG, customerLat, customerLng).toFixed(3));

  if (distanceKm <= FREE_RADIUS_KM) {
    return { distanceKm, fee: 0, isFree: true };
  }

  const extraKm = distanceKm - FREE_RADIUS_KM;
  const fee = parseFloat((BASE_FEE + extraKm * EXTRA_PER_KM).toFixed(2));
  return { distanceKm, fee, isFree: false };
}

/**
 * Returns the delivery settings so the frontend can display them.
 */
function getDeliverySettings() {
  return {
    base_lat: BASE_LAT,
    base_lng: BASE_LNG,
    free_radius_km: FREE_RADIUS_KM,
    base_fee: BASE_FEE,
    extra_per_km: EXTRA_PER_KM,
  };
}

module.exports = { calculateDeliveryFee, getDeliverySettings, haversineKm };
