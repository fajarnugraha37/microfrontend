export const passListeners = (ctx) => {
  if (!ctx) {
    return {};
  }
  if (ctx.listeners) {
    return ctx.listeners;
  }
  if (ctx.attrs && typeof ctx.attrs === 'object') {
    const listeners = {};
    Object.keys(ctx.attrs).forEach((key) => {
      if (key.startsWith('on')) {
        listeners[key] = ctx.attrs[key];
      }
    });
    return listeners;
  }
  return {};
};

export const slot = (slots, name, props) => {
  if (!slots) {
    return undefined;
  }
  const target = slots[name] || slots.default;
  return typeof target === 'function' ? target(props) : target;
};
