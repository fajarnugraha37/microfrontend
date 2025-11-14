export default function(value) {
  // Example: at least 8 chars, 1 number, 1 uppercase
  if (!value) return false;
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}
