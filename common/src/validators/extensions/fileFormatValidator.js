export default function(value, args) {
  if (!value || !args || !args.length) return false;
  const allowed = args;
  const ext = value.split('.').pop().toLowerCase();
  return allowed.includes(ext);
}
