const clone = (value) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[store-bridge] failed to clone value, returning reference', error);
    }
    return value;
  }
};

const bindStoreMethod = (store, methodName) => {
  const method = store && typeof store[methodName] === 'function' ? store[methodName] : null;
  return method ? method.bind(store) : undefined;
};

export default function createStoreBridge(store) {
  if (!store) {
    throw new Error('[store-bridge] Vuex store instance is required');
  }

  const trackedTeardowns = new Set();

  const trackTeardown = (fn) => {
    if (typeof fn !== 'function') {
      return () => {};
    }

    trackedTeardowns.add(fn);
    return () => {
      if (trackedTeardowns.has(fn)) {
        trackedTeardowns.delete(fn);
        fn();
      }
    };
  };

  const bridge = {
    get id() {
      return 'common-shell-store';
    },
    get state() {
      return store.state;
    },
    get getters() {
      return store.getters;
    },
    getState: () => clone(store.state),
    commit: bindStoreMethod(store, 'commit'),
    dispatch: bindStoreMethod(store, 'dispatch'),
    replaceState: bindStoreMethod(store, 'replaceState'),
    registerModule: bindStoreMethod(store, 'registerModule'),
    unregisterModule: bindStoreMethod(store, 'unregisterModule'),
    hasModule: bindStoreMethod(store, 'hasModule'),
    subscribe(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }

      const unsubscribe = store.subscribe((mutation, state) => {
        const safeMutation = {
          type: mutation.type,
          payload: clone(mutation.payload)
        };

        listener(safeMutation, clone(state));
      });

      return trackTeardown(unsubscribe);
    },
    watch(getter, callback, options) {
      if (typeof getter !== 'function' || typeof callback !== 'function') {
        return () => {};
      }

      const unwatch = store.watch(
        getter,
        (value, oldValue) => {
          callback(clone(value), clone(oldValue));
        },
        options
      );

      return trackTeardown(unwatch);
    },
    teardown() {
      Array.from(trackedTeardowns).forEach((fn) => {
        try {
          fn();
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[store-bridge] teardown failed', error);
          }
        }
      });
      trackedTeardowns.clear();
    }
  };

  return bridge;
}
