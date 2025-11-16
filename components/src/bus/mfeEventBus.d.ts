// mfeEventBus.d.ts - type declarations for MfeEventBus
import { DomEventTarget, DomEventBusOptions, DomEventHandler } from './domEventBus';

export type EventBusOptions = DomEventBusOptions & {
  defaultTimeout?: number;
  debug?: boolean;
};

export type EventHandler = (payload: any) => void;
export type RpcHandler = (params: any) => Promise<any> | any;

export declare class MfeEventBus {
  constructor(target: DomEventTarget, options?: EventBusOptions);
  onEvent(eventName: string, handler: EventHandler): () => void;
  onceEvent(eventName: string, handler: EventHandler): () => void;
  emitEvent(eventName: string, payload?: any): void;
  handle(method: string, handler: RpcHandler): () => void;
  request(method: string, params?: any, options?: { timeout?: number }): Promise<any>;
  destroy(): void;
}
