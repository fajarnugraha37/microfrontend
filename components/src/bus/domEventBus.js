// domEventBus.js
// Tiny DOM CustomEvent bus used as transport for microfrontends.
// Works in browsers; can be wired to window, document, or a custom EventTarget.

// @ts-check

/**
 * @typedef {EventTarget & {
 *   addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
 *   removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
 *   dispatchEvent(event: Event): boolean;
 * }} DomEventTarget
 */

/**
 * @typedef {Object} DomEventBusOptions
 * @property {string} [prefix]  - optional prefix for all event names, e.g. "aceas:"
 * @property {boolean} [bubbles] - default: false
 * @property {boolean} [composed] - default: false
 * @property {boolean} [cancelable] - default: false
 */

/**
 * @callback DomEventHandler
 * @param {any} detail - event payload (CustomEvent.detail)
 * @param {CustomEvent} event - original event
 */

export class DomEventBus {
    /**
     * @param {DomEventTarget} target - usually window or document
     * @param {DomEventBusOptions} [options]
     */
    constructor(target, options = {}) {
        if (!target) {
            throw new Error(
                "[DomEventBus] target is required (e.g., window, document, or a custom EventTarget)."
            );
        }

        /** @type {DomEventTarget} */
        this._target = target;
        this._prefix = options.prefix || "";
        this._defaultEventInit = {
            bubbles: options.bubbles ?? false,
            composed: options.composed ?? false,
            cancelable: options.cancelable ?? false,
        };

        /** @type {Map<string, Set<EventListener>>} */
        this._listeners = new Map();
    }

    /**
     * Build the actual DOM event name (with prefix).
     * @param {string} type
     * @returns {string}
     * @private
     */
    _fullType(type) {
        return this._prefix ? this._prefix + type : type;
    }

    /**
     * Subscribe to an event.
     *
     * @param {string} type - logical event name (without prefix)
     * @param {DomEventHandler} handler
     * @param {AddEventListenerOptions | boolean} [options]
     * @returns {() => void} unsubscribe function
     */
    on(type, handler, options) {
        const fullType = this._fullType(type);

        /** @type {EventListener} */
        const wrapped = (ev) => {
            if (!(ev instanceof CustomEvent)) return;

            try {
                handler(ev.detail, ev);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(
                    `[DomEventBus] error in handler for "${fullType}":`,
                    err
                );
            }
        };

        this._target.addEventListener(fullType, wrapped, options);

        let set = this._listeners.get(fullType);
        if (!set) {
            set = new Set();
            this._listeners.set(fullType, set);
        }
        set.add(wrapped);

        return () => {
            this.off(type, wrapped, options);
        };
    }

    /**
     * Subscribe to an event once, then auto-unsubscribe.
     *
     * @param {string} type
     * @param {DomEventHandler} handler
     * @param {AddEventListenerOptions | boolean} [options]
     * @returns {() => void} unsubscribe function
     */
    once(type, handler, options) {
        let unsub = () => { };
        /** @type {DomEventHandler} */
        const wrapped = (detail, ev) => {
            unsub();
            handler(detail, ev);
        };
        unsub = this.on(type, wrapped, options);
        return unsub;
    }

    /**
     * Unsubscribe a specific handler from an event.
     *
     * @param {string} type
     * @param {EventListener} listener
     * @param {EventListenerOptions | boolean} [options]
     */
    off(type, listener, options) {
        const fullType = this._fullType(type);

        this._target.removeEventListener(fullType, listener, options);

        const set = this._listeners.get(fullType);
        if (set) {
            set.delete(listener);
            if (set.size === 0) {
                this._listeners.delete(fullType);
            }
        }
    }

    /**
     * Emit an event with optional payload.
     *
     * @param {string} type
     * @param {any} [detail]
     * @param {CustomEventInit} [init]
     */
    emit(type, detail, init) {
        const fullType = this._fullType(type);
        /** @type {CustomEventInit} */
        const eventInit = {
            ...this._defaultEventInit,
            ...init,
            detail,
        };
        const ev = new CustomEvent(fullType, eventInit);
        this._target.dispatchEvent(ev);
    }

    /**
     * Remove all listeners for a given event type,
     * or all listeners if type is omitted.
     *
     * @param {string} [type]
     */
    removeAllListeners(type) {
        if (type) {
            const fullType = this._fullType(type);
            const set = this._listeners.get(fullType);
            if (!set) return;
            for (const listener of set) {
                this._target.removeEventListener(fullType, listener);
            }
            this._listeners.delete(fullType);
            return;
        }

        for (const [fullType, set] of this._listeners.entries()) {
            for (const listener of set) {
                this._target.removeEventListener(fullType, listener);
            }
        }
        this._listeners.clear();
    }

    /**
     * Dispose the bus and remove all listeners.
     */
    destroy() {
        this.removeAllListeners();
        // @ts-ignore
        this._target = null;
    }
}
