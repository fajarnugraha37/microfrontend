// index.d.ts - top-level declarations for bus exports
import { MicrofrontBus } from './microfrontBus';
import { MfeEventBus } from './mfeEventBus';

export const bus: MicrofrontBus;
export const mfeEventBus: MfeEventBus;

export { MicrofrontBus } from './microfrontBus';
export { MfeEventBus } from './mfeEventBus';
export { DomEventBus } from './domEventBus';

export default bus;
