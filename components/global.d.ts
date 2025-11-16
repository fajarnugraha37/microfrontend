export {};

// declare .vue SFC import behavior
declare module '*.vue' {
  import Vue from 'vue';
  import { ComponentOptions } from 'vue';
  const component: ComponentOptions<Vue>;
  export default component;
}

// Basic plugin helper for Pinia usage in the `window` helpers
declare class PiniaPlugin {
  install(app: import("pinia").Pinia, options: Record<string, any>): void;
}

// Component runtime exports (named) and default plugin
import Vue from 'vue';

export const CButton: Vue.ComponentOptions<Vue> & { new(): Vue };
export const CInput: Vue.ComponentOptions<Vue> & { new(): Vue };

// utils
export function getModuleState(rootState: Record<string, any>, namespace: string): any;
export function deepPatch(target: any, patch: any): void;

// stores
export type VuexStore = import('vuex').Store & { state: Record<string, any> };
export function createPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, namespace: string, options?: { id?: string; mapState?: (s: any) => any; enableCrossTabSync?: boolean; crossTabChannelName?: string; crossTabThrottleMs?: number; enableLocalStorageFallback?: boolean; }): () => import('pinia').Store<any, any>;
export function createGlobalPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, options?: { id?: string; mapState?: (s: Record<string, any>) => any; enableCrossTabSync?: boolean; crossTabChannelName?: string; crossTabThrottleMs?: number; enableLocalStorageFallback?: boolean; }): () => import('pinia').Store<any, any>;
export function createVuexModulePiniaBridge(options: { vuex: VuexStore; namespace: string; piniaStore: import('pinia').Store<any, any> }): () => void;
export function createVuexRootPiniaBridge(options: { vuex: VuexStore; piniaStore: import('pinia').Store<any, any> }): () => void;
export function registerBridges(vuex: VuexStore, pinia: import('pinia').Pinia, modules?: { store: () => import('pinia').Store<any, any>; namespace: string }[]): () => void;
export const bridgeReplaceState: (namespace: string, state: Record<string, any>, newRoot: Record<string, any>) => void;
export const useVuexStore: (vue: typeof import('vue'), globalStore: import('vuex').Store<any>) => void;
export const useDerivedStore: (pinia: import('pinia').Pinia, namespace: string, options?: Record<string, any>) => () => import('pinia').Store<any, any>;
export const usePiniaStore: (pinia: import('pinia').Pinia, pluginOptions?: { enableCrossTabSync?: boolean; crossTabChannelName?: string; crossTabThrottleMs?: number; enableLocalStorageFallback?: boolean; }) => { install(app: any, options?: Record<string, any>): void };

declare const _default: {
  install(Vue: typeof import('vue')): void;
  CButton: typeof CButton;
  CInput: typeof CInput;
  deepPatch: typeof deepPatch;
  getModuleState: typeof getModuleState;
  bridgeReplaceState: typeof bridgeReplaceState;
  createGlobalPiniaStoreFromVuex: typeof createGlobalPiniaStoreFromVuex;
  createPiniaStoreFromVuex: typeof createPiniaStoreFromVuex;
  createVuexModulePiniaBridge: typeof createVuexModulePiniaBridge;
  createVuexRootPiniaBridge: typeof createVuexRootPiniaBridge;
  registerBridges: typeof registerBridges;
  useDerivedStore: typeof useDerivedStore;
  usePiniaStore: typeof usePiniaStore;
  useVuexStore: typeof useVuexStore;
};

export default _default;

declare global {
  interface Window {
    Vue: typeof import("vue");
    Vuex: typeof import("vuex");
    VueRouter: typeof import("vue-router").default;
    Pinia: typeof import("pinia");

    store: import("vuex").Store<any>;
    globalStore: import("vuex").Store<any>;
    bridgeStore: import("pinia").Store<string, any>;
    derivedStore: Record<string, import("pinia").Store<any>>;

    useVuexStore: (vuex: typeof import("vue").VueConstructor, globalStore: import("vuex").Store<string, any>, callback?: (store: import("vuex").Store<string, any>) => void) => void;
    useBridgeStore: () => import("pinia").Store<any>;
    useDerivedStore: (pinia: import("pinia"), namespace: string, options?: Record<string, any>) => () => import('pinia').Store;
    usePiniaStore: (pinia: import("pinia")) => PiniaPlugin;
  }
}

export = _;
export as namespace _;

declare const _: _.LoDashStatic;
declare namespace _ {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- (This will be augmented)
  interface LoDashStatic {
    diff(s: any, state: Record<string, any>): unknown;
  }
}
