export default function(value) {
  // Require at least 8 characters, any type
  if (!value) return false;
  return value.length >= 8;
}
