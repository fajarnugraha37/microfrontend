export * from "./configLoader";
export * from "./formatPrice";
export * from "./obj";

import loadConfig from "./configLoader";
import formatPrice from "./formatPrice";
import obj from "./obj";

export const utils = {
  formatDate: (value) => {
    if (!value) {
      return '';
    }
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  },
  checkPermissions: (user, permission) => {
    if (!user || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(permission);
  },
  delay: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms)),
  formatPrice: formatPrice,
  loadConfig: loadConfig,
  obj: obj,
};

export const useUtilities = (vue) => {
  vue.use(new class UtilitiesPlugin {
    install(Vue) {
      Vue.prototype.$utils = utils;
    }
  })
}