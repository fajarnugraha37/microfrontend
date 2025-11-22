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
export function createPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, namespace: string, options?: { id?: string; mapState?: (s: any) => any }): () => import('pinia').Store<any, any>;
export function createGlobalPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, options?: { id?: string; mapState?: (s: Record<string, any>) => any }): () => import('pinia').Store<any, any>;
export function createVuexModulePiniaBridge(options: { vuex: VuexStore; namespace: string; piniaStore: import('pinia').Store<any, any> }): () => void;
export function createVuexRootPiniaBridge(options: { vuex: VuexStore; piniaStore: import('pinia').Store<any, any> }): () => void;

export function registerBridges(vuex: VuexStore, pinia: import('pinia').Pinia, modules?: { store: () => import('pinia').Store<any, any>; namespace: string }[]): () => void;
export const bridgeReplaceState: (namespace: string, state: Record<string, any>, newRoot: Record<string, any>) => void;

export const useVuexStore: (vuex: typeof import("vue").VueConstructor, globalStore: import("vuex").Store<string, any>, callback?: (store: import("vuex").Store<string, any>) => void) => void;
export const useDerivedStore: (pinia: import("pinia"), piniaInstace: import("pinia").Pinia, namespace: string, options?: Record<string, any>) => () => import('pinia').Store;
export const usePiniaStore: (pinia: import("pinia"), piniaInstace: import('pinia').Pinia) => PiniaPlugin;
export const useBridgeStore: (pinia: import("pinia"), piniaInstace: import('pinia').Pinia) => PiniaPlugin;

// bus API
export class DomEventBus {
  constructor(target: any, options?: {
    prefix?: string;
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  });
  on(type: string, handler: (detail: any, ev?: CustomEvent) => void, options?: boolean | AddEventListenerOptions): () => void;
  once(type: string, handler: (detail: any, ev?: CustomEvent) => void, options?: boolean | AddEventListenerOptions): () => void;
  off(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  emit(type: string, detail?: any, init?: CustomEventInit): void;
  removeAllListeners(type?: string): void;
  destroy(): void;
}

export class MfeEventBus {
  constructor(target: any, options?: { prefix?: string; defaultTimeout?: number; debug?: boolean; bubbles?: boolean; composed?: boolean; cancelable?: boolean });
  onEvent(eventName: string, handler: (payload: any) => void): () => void;
  onceEvent(eventName: string, handler: (payload: any) => void): () => void;
  emitEvent(eventName: string, payload?: any): void;
  handle(method: string, handler: (params: any) => Promise<any> | any): () => void;
  request(method: string, params?: any, options?: { timeout?: number }): Promise<any>;
  destroy(): void;
}

export class MicrofrontBus {
  constructor(target: any, options?: { prefix?: string; defaultTimeout?: number; debug?: boolean });
  onEvent(eventName: string, handler: (payload: any) => void): () => void;
  onceEvent(eventName: string, handler: (payload: any) => void): () => void;
  emitEvent(eventName: string, payload?: any): void;
  handle(method: string, handler: (params: any) => Promise<any> | any): () => void;
  request(method: string, params?: any, options?: { timeout?: number }): Promise<any>;
  destroy(): void;
}

export const bus: MicrofrontBus;
export const mfeEventBus: MfeEventBus;

// compat
export const useTransferablePlugin: {
    version: string;
    type: string;
    name: string;
    install(app: any, options: {
        [key: string]: Record<string, any>;
    }): void;
}

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

    $__store: import("vuex").Store<any>;
    $__useVuexStore:typeof useVuexStore;
    $__useDerivedStore: typeof useDerivedStore;
    $__usePiniaStore: typeof usePiniaStore;
    $__useBridgeStore: typeof useBridgeStore;
    $__registerBridges: typeof registerBridges;
    $__bridgeReplaceState: typeof bridgeReplaceState;

    $__bus?: MicrofrontBus;
    $__mfeEventBus?: MfeEventBus;
    
    $__useTransferablePlugin: typeof useTransferablePlugin;
    $__pluginRegistry: Function[];
    $__mixinRegistry: Function[];
    $__directiveRegistry: Function[];
    $__filterRegistry: Function[];

    __POWERED_BY_QIANKUN__?: boolean;
  }
}

declare module 'pinia' {
  interface Pinia {
    $__bridgeStore: (import('pinia').Store<any, any>) & { disposeBridge: () => void }
    $__derivedStore:(
      Record<string, (import('pinia').Store<any, any> & ({ disposeBridge: () => void }))> 
      & ({ disposeBridge: () => void })
    );
  }
}

export = _;
export as namespace _;

declare const _: _.LoDashStatic;
declare module 'lodash' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- (This will be augmented)
  interface LoDashStatic {
    diff(s: any, state: Record<string, any>): unknown;
  }
}
