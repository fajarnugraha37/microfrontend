export default function(value) {
  // Example: Singapore NRIC format S1234567D
  if (!value) return false;
  return /^[STFG]\d{7}[A-Z]$/.test(value);
}
