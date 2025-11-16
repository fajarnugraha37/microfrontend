// bus.js
import { MfeEventBus } from "./mfeEventBus";
import { MicrofrontBus } from "./microfrontBus";

/**
 * Safe target for browser; throws clearly on SSR.
 */
const target =
    typeof window !== "undefined"
        ? window
        : (() => {
            throw new Error(
                "MicrofrontBus: window is not available; use only in browser."
            );
        })();

/**
 * Shared bus instance for all MFEs.
 * Make sure bundler treats this module as a singleton.
 */
export const bus = window.bus = new MicrofrontBus(target, {
    prefix: "aceas:",     // avoid collisions with other scripts on page
    defaultTimeout: 5000, // RPC timeout
    debug: false,         // set true in dev
});


/**
 * shared singleton bus.
 * make sure your bundler treats this module as a singleton across MFEs.
 */
export const mfeEventBus = window.mfeEventBus = new MfeEventBus(target, {
    prefix: "aceas:",     // avoid collisions with other scripts
    defaultTimeout: 5000, // RPC timeout
    debug: false,         // turn on in dev
});