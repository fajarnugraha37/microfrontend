import { initGlobalState } from 'qiankun';

const initialState = {
  user: null,
  token: null,
  lastLogin: null
};

const actions = initGlobalState(initialState);
let currentState = { ...initialState };

actions.onGlobalStateChange((state) => {
  currentState = { ...state };
}, true);

const mergedSetGlobalState = (state) => {
  currentState = { ...currentState, ...state };
  actions.setGlobalState(currentState);
};

export default {
  onGlobalStateChange: actions.onGlobalStateChange,
  setGlobalState: mergedSetGlobalState,
  offGlobalStateChange: actions.offGlobalStateChange,
  getGlobalState: () => ({ ...currentState })
};
