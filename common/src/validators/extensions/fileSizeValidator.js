export default function(value, [maxSize]) {
  if (!value || !value.size) return false;
  return value.size <= maxSize;
}
