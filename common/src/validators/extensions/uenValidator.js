export default function(value) {
  // Example: Singapore UEN format
  if (!value) return false;
  return /^[0-9]{8}[A-Z]$/.test(value) || /^[0-9]{9}[A-Z]$/.test(value);
}
