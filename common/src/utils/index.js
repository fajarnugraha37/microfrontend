import loadConfig from "./configLoader";
import formatPrice from "./formatPrice";

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
};

export const useUtilities = (vue) => {
  vue.use({
    install(Vue) {
      Vue.prototype.$utils = utils;
    },
  })
}