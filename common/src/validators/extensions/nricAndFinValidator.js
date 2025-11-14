import nricValidator from './nricValidator';
import finValidator from './finValidator';
export default function(value) {
  return nricValidator(value) || finValidator(value);
}
