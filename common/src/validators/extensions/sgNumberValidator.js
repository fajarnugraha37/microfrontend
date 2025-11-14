export default function(value) {
  // Example: Singapore phone number
  if (!value) return false;
  return /^\+65\d{8}$/.test(value) || /^\d{8}$/.test(value);
}
