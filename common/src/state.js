import { initGlobalState } from 'qiankun';

const initialState = {
  user: null,
  token: null,
  lastLogin: null,
  shellStore: null
};

const actions = initGlobalState(initialState);
let currentState = { ...initialState };

const clone = (value) => {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
};

actions.onGlobalStateChange((state) => {
  currentState = clone(state);
}, true);

const updateGlobalState = (state) => {
  const nextState = { ...currentState, ...state };
  if (state && typeof state.shellStore === 'object') {
    nextState.shellStore = clone(state.shellStore);
  }
  currentState = nextState;
  actions.setGlobalState(clone(currentState));
};

const mergedSetGlobalState = (state) => {
  updateGlobalState(state);
};

const setShellStore = (shellStore) => {
  const snapshot = shellStore ? clone(shellStore) : shellStore;
  updateGlobalState({ shellStore: snapshot });
};

export default {
  onGlobalStateChange: actions.onGlobalStateChange,
  setGlobalState: mergedSetGlobalState,
  offGlobalStateChange: actions.offGlobalStateChange,
  getGlobalState: () => clone(currentState),
  setShellStore
};
