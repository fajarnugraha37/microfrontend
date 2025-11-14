export default function(value) {
  // Example: Singapore FIN format F1234567N
  if (!value) return false;
  return /^[FG]\d{7}[A-Z]$/.test(value);
}
