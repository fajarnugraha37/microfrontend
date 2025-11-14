/**
 * Format number as price string
 * @param {number} value
 * @returns {string}
 */
export default function formatPrice(value) {
  return 'Rp ' + Number(value).toLocaleString('id-ID');
}
