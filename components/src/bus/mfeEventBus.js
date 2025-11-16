// mfeEventBus.js
// Microfrontend Event Bus: one-way events + two-way RPC on top of DOM CustomEvent.
// @ts-check

/**
 * @typedef {EventTarget & {
 *   addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
 *   removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
 *   dispatchEvent(event: Event): boolean;
 * }} DomEventTarget
 */

/**
 * @typedef {Object} EventBusOptions
 * @property {string} [prefix]          - prefix for all DOM events, e.g. "aceas:"
 * @property {number} [defaultTimeout]  - default RPC timeout in ms (default: 5000)
 * @property {boolean} [debug]          - log all traffic to console
 * @property {boolean} [bubbles]        - default CustomEvent.bubbles (default: false)
 * @property {boolean} [composed]       - default CustomEvent.composed (default: false)
 * @property {boolean} [cancelable]     - default CustomEvent.cancelable (default: false)
 */

/**
 * @callback EventHandler
 * @param {any} payload
 */

/**
 * @callback RpcHandler
 * @param {any} params
 * @returns {any | Promise<any>}
 */

// ---------------------- internals ----------------------

/**
 * @param {DomEventTarget} target
 * @param {string} type
 * @param {(detail: any, ev: CustomEvent) => void} handler
 * @param {AddEventListenerOptions | boolean} [options]
 * @returns {() => void}
 */
function domOn(target, type, handler, options) {
    /** @type {EventListener} */
    const wrapped = (ev) => {
        if (!(ev instanceof CustomEvent)) return;
        try {
            handler(ev.detail, ev);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`[MfeEventBus] error in handler for "${type}":`, err);
        }
    };

    target.addEventListener(type, wrapped, options);

    return () => {
        target.removeEventListener(type, wrapped, options);
    };
}

/**
 * @param {DomEventTarget} target
 * @param {string} type
 * @param {any} detail
 * @param {CustomEventInit} [init]
 */
function domEmit(target, type, detail, init) {
    const ev = new CustomEvent(type, { ...init, detail });
    target.dispatchEvent(ev);
}

// Simple request id generator.
let _reqCounter = 0;
function createRequestId() {
    _reqCounter = (_reqCounter + 1) % Number.MAX_SAFE_INTEGER;
    return `mfe:${Date.now().toString(36)}:${Math.random()
        .toString(16)
        .slice(2)}:${_reqCounter}`;
}

// ---------------------- main class ----------------------

export class MfeEventBus {
    /**
     * @param {DomEventTarget} target - usually window
     * @param {EventBusOptions} [options]
     */
    constructor(target, options = {}) {
        if (!target) {
            throw new Error("[MfeEventBus] target is required (e.g., window).");
        }

        /** @type {DomEventTarget} */
        this._target = target;

        this._prefix = options.prefix || "";
        this._debug = !!options.debug;
        this._defaultTimeout =
            typeof options.defaultTimeout === "number"
                ? options.defaultTimeout
                : 5000;

        this._defaultEventInit = {
            bubbles: options.bubbles ?? false,
            composed: options.composed ?? false,
            cancelable: options.cancelable ?? false,
        };

        /** @type {Map<string, RpcHandler>} */
        this._rpcHandlers = new Map();

        /** @type {Map<string, { resolve: Function; reject: Function; timeoutId: any }>} */
        this._pending = new Map();

        /** @type {Set<() => void>} */
        this._unsubscribers = new Set();

        // listen globally for RPC requests & responses
        this._listenRpc();
    }

    // ---------- internal helpers ----------

    /**
     * @param {string} logical
     * @returns {string}
     * @private
     */
    _evt(logical) {
        return this._prefix ? `${this._prefix}${logical}` : logical;
    }

    /**
     * 
     * @param  {...any} args 
     * @returns 
     */
    _log(...args) {
        if (!this._debug) return;
        // eslint-disable-next-line no-console
        console.log("[MfeEventBus]", ...args);
    }

    /**
     * 
     * @param  {...any} args 
     * @returns 
     */
    _warn(...args) {
        // eslint-disable-next-line no-console
        console.warn("[MfeEventBus]", ...args);
    }

    /**
     * 
     * @param  {...any} args 
     * @returns 
     */
    _error(...args) {
        // eslint-disable-next-line no-console
        console.error("[MfeEventBus]", ...args);
    }

    _listenRpc() {
        const reqType = this._evt("__rpc:request");
        const resType = this._evt("__rpc:response");

        const unsubReq = domOn(this._target, reqType, (detail) =>
            this._onRpcRequest(detail)
        );
        const unsubRes = domOn(this._target, resType, (detail) =>
            this._onRpcResponse(detail)
        );

        this._unsubscribers.add(unsubReq);
        this._unsubscribers.add(unsubRes);
    }

    /**
     * @param {{ id: string; method: string; params: any }} detail
     * @private
     */
    async _onRpcRequest(detail) {
        const { id, method, params } = detail || {};
        const handler = this._rpcHandlers.get(method);

        if (!handler) {
            this._warn(`no RPC handler for method "${method}"`);
            domEmit(
        /** @type any */(this._target),
                this._evt("__rpc:response"),
                {
                    id,
                    error: { message: `No handler for method "${method}"` },
                },
                this._defaultEventInit
            );
            return;
        }

        this._log("RPC request", { id, method, params });

        try {
            const result = await handler(params);
            domEmit(
        /** @type any */(this._target),
                this._evt("__rpc:response"),
                { id, result },
                this._defaultEventInit
            );
        } catch (err) {
            this._error(`RPC handler "${method}" threw:`, err);
            domEmit(
        /** @type any */(this._target),
                this._evt("__rpc:response"),
                {
                    id,
                    error: {
                        // @ts-ignore
                        message: err && err.message ? err.message : "RPC handler error",
                    },
                },
                this._defaultEventInit
            );
        }
    }

    /**
     * @param {{ id: string; result?: any; error?: any }} detail
     * @private
     */
    _onRpcResponse(detail) {
        const { id, result, error } = detail || {};
        const pending = this._pending.get(id);
        if (!pending) return;

        this._pending.delete(id);
        clearTimeout(pending.timeoutId);

        this._log("RPC response", { id, result, error });

        if (error) pending.reject(error);
        else pending.resolve(result);
    }

    // ---------- one-way events (pub/sub) ----------

    /**
     * Subscribe to an event (one-way).
     *
     * @param {string} eventName
     * @param {EventHandler} handler
     * @returns {() => void} unsubscribe
     */
    onEvent(eventName, handler) {
        const type = this._evt(`evt:${eventName}`);
        this._log("onEvent", eventName);

        const unsub = domOn(this._target, type, (payload) => {
            handler(payload);
        });

        this._unsubscribers.add(unsub);
        return () => {
            unsub();
            this._unsubscribers.delete(unsub);
        };
    }

    /**
     * Subscribe once to an event.
     *
     * @param {string} eventName
     * @param {EventHandler} handler
     * @returns {() => void} unsubscribe (will already be executed after first event)
     */
    onceEvent(eventName, handler) {
        let unsub = () => { };
        /** @type {EventHandler} */
        const wrapped = (payload) => {
            unsub();
            handler(payload);
        };
        unsub = this.onEvent(eventName, wrapped);
        return unsub;
    }

    /**
     * Emit/broadcast an event.
     *
     * @param {string} eventName
     * @param {any} [payload]
     */
    emitEvent(eventName, payload) {
        const type = this._evt(`evt:${eventName}`);
        this._log("emitEvent", eventName, payload);
        domEmit(
      /** @type any */(this._target),
            type,
            payload,
            this._defaultEventInit
        );
    }

    // ---------- two-way RPC ----------

    /**
     * Register an RPC handler for a method name.
     *
     * @param {string} method
     * @param {RpcHandler} handler
     * @returns {() => void} unregister
     */
    handle(method, handler) {
        if (this._rpcHandlers.has(method)) {
            this._warn(`overwriting RPC handler for "${method}"`);
        }
        this._rpcHandlers.set(method, handler);
        this._log("handle", method);

        return () => {
            this._rpcHandlers.delete(method);
        };
    }

    /**
     * Send an RPC request to whoever handles this method.
     *
     * @param {string} method
     * @param {any} [params]
     * @param {{ timeout?: number }} [options]
     * @returns {Promise<any>}
     */
    request(method, params, options = {}) {
        const id = createRequestId();
        const timeoutMs = options.timeout ?? this._defaultTimeout;

        this._log("request", { id, method, params, timeoutMs });

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this._pending.delete(id);
                reject({
                    message: `RPC timeout for method "${method}" after ${timeoutMs}ms`,
                });
            }, timeoutMs);

            this._pending.set(id, { resolve, reject, timeoutId });

            domEmit(
        /** @type any */(this._target),
                this._evt("__rpc:request"),
                { id, method, params },
                this._defaultEventInit
            );
        });
    }

    // ---------- cleanup ----------

    /**
     * Remove all listeners & cancel pending RPCs.
     */
    destroy() {
        this._log("destroy");
        for (const unsub of this._unsubscribers) {
            try {
                unsub();
            } catch (err) {
                this._error("error during unsubscribe:", err);
            }
        }
        this._unsubscribers.clear();

        for (const [id, pending] of this._pending.entries()) {
            clearTimeout(pending.timeoutId);
            pending.reject({ message: "Event bus destroyed" });
        }
        this._pending.clear();
        this._rpcHandlers.clear();
    }
}
