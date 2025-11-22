// microfrontBus.d.ts - type declarations for MicrofrontBus
import { DomEventTarget } from './domEventBus';
import { MfeEventBus } from './mfeEventBus';

export type MicrofrontBusOptions = {
  prefix?: string;
  defaultTimeout?: number;
  debug?: boolean;
};

export declare class MicrofrontBus {
  constructor(target: DomEventTarget, options?: MicrofrontBusOptions);
  onEvent(eventName: string, handler: (payload: any) => void): () => void;
  onceEvent(eventName: string, handler: (payload: any) => void): () => void;
  emitEvent(eventName: string, payload?: any): void;
  handle(method: string, handler: (params: any) => Promise<any> | any): () => void;
  request(method: string, params?: any, options?: { timeout?: number }): Promise<any>;
  destroy(): void;
}

export default MicrofrontBus;
