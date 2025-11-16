// Merged into `global.d.ts` - placeholders are kept for compatibility
export type VuexStore = import('vuex').Store & { state: Record<string, any> };

export function createPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, namespace: string, options?: { id?: string; mapState?: (s: any) => any }): () => import('pinia').Store<any, any>;

export function createGlobalPiniaStoreFromVuex(pinia: import('pinia').Pinia, vuex: VuexStore, options?: { id?: string; mapState?: (s: Record<string, any>) => any }): () => import('pinia').Store<any, any>;

export function createVuexModulePiniaBridge(options: { vuex: VuexStore; namespace: string; piniaStore: import('pinia').Store<any, any> }): () => void;

export function createVuexRootPiniaBridge(options: { vuex: VuexStore; piniaStore: import('pinia').Store<any, any> }): () => void;

export function registerBridges(vuex: VuexStore, pinia: import('pinia').Pinia, modules?: { store: () => import('pinia').Store<any, any>; namespace: string }[]): () => void;

export const bridgeReplaceState: (namespace: string, state: Record<string, any>, newRoot: Record<string, any>) => void;

export const useVuexStore: (vue: typeof import('vue'), globalStore: import('vuex').Store<any>, callback?: (store: import('vuex').Store<any>) => void) => void;

export const useDerivedStore: (pinia: import('pinia').Pinia, namespace: string, options?: Record<string, any>) => () => import('pinia').Store<any, any>;

export const usePiniaStore: (pinia: import('pinia').Pinia) => { install(app: any, options?: Record<string, any>): void };
