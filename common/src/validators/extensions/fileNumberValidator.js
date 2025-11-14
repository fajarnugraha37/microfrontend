export default function(value, [min, max]) {
  if (!Array.isArray(value)) return false;
  return value.length >= min && value.length <= max;
}
