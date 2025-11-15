import { createVuexModulePiniaStore } from "./createVuexModulePiniaStore";
import { registerAllVuexModulesAsPinia } from "./registerAllVuexModulesAsPinia";
import { configureVuexBridge, getGlobalStore } from "./vuexBridgeConfig";

export * from "./createVuexModulePiniaStore";
export * from "./registerAllVuexModulesAsPinia";
export * from "./vuexBridgeConfig";

window.createVuexModulePiniaStore = createVuexModulePiniaStore;
window.registerAllVuexModulesAsPinia = registerAllVuexModulesAsPinia;
window.configureVuexBridge = configureVuexBridge;
window.getGlobalStore = getGlobalStore;