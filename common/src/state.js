const initialState = {
  user: null,
  token: null,
  lastLogin: null,
  shellStore: null
};

let currentState = { ...initialState };
const listeners = new Set();

const clone = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[global-state] failed to clone value', error);
    }
    return value;
  }
};

const notify = (prevState) => {
  listeners.forEach((callback) => {
    try {
      callback(clone(currentState), clone(prevState));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[global-state] listener threw an error', error);
      }
    }
  });
};

const updateGlobalState = (state) => {
  const safeState = state && typeof state === 'object' ? clone(state) : {};
  const nextState = { ...currentState, ...safeState };
  if (state && typeof state.shellStore === 'object') {
    nextState.shellStore = clone(state.shellStore);
  }
  const previous = clone(currentState);
  currentState = nextState;
  notify(previous);
};

const mergedSetGlobalState = (state) => {
  updateGlobalState(state);
};

const setShellStore = (shellStore) => {
  const snapshot = shellStore ? clone(shellStore) : shellStore;
  updateGlobalState({ shellStore: snapshot });
};

export default {
  onGlobalStateChange(callback, fireImmediately = false) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    listeners.add(callback);
    if (fireImmediately) {
      callback(clone(currentState), clone(currentState));
    }

    return () => {
      listeners.delete(callback);
    };
  },
  setGlobalState: mergedSetGlobalState,
  offGlobalStateChange(callback) {
    if (listeners.has(callback)) {
      listeners.delete(callback);
    }
  },
  getGlobalState: () => clone(currentState),
  setShellStore
};
