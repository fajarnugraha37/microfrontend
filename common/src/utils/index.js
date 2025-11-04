export const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export const checkPermissions = (user, permission) => {
  if (!user || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.includes(permission);
};

export const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
