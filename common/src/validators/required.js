/**
 * Required field validator
 * @param {string|number|boolean|null|undefined} value
 * @returns {boolean|string}
 */
function required(value) {
  if (value === null || value === undefined || value === '') {
    return 'This field is required.';
  }
  return true;
}

export default required;