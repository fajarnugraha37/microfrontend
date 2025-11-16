// domEventBus.d.ts - type declarations for DomEventBus
export type DomEventTarget = EventTarget & {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: Event): boolean;
};

export type DomEventBusOptions = {
  prefix?: string;
  bubbles?: boolean;
  composed?: boolean;
  cancelable?: boolean;
};

export type DomEventHandler = (detail: any, event?: CustomEvent) => void;

export declare class DomEventBus {
  constructor(target: DomEventTarget, options?: DomEventBusOptions);
  on(type: string, handler: DomEventHandler, options?: boolean | AddEventListenerOptions): () => void;
  once(type: string, handler: DomEventHandler, options?: boolean | AddEventListenerOptions): () => void;
  off(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  emit(type: string, detail?: any, init?: CustomEventInit): void;
  removeAllListeners(type?: string): void;
  destroy(): void;
}
