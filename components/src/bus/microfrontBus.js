// microfrontBus.js
// High-level microfrontend bus: one-way events + two-way RPC on top of DomEventBus.

// @ts-check
import { DomEventBus } from "./domEventBus";

/**
 * @typedef {Object} MicrofrontBusOptions
 * @property {string} [prefix]          - prefix for all DOM events, e.g. "aceas:"
 * @property {number} [defaultTimeout]  - default RPC timeout in ms (default: 5000)
 * @property {boolean} [debug]          - log all traffic to console
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

// simple request id generator (no deps)
let _reqCounter = 0;
function createRequestId() {
    _reqCounter = (_reqCounter + 1) % Number.MAX_SAFE_INTEGER;
    return `mfe:${Date.now().toString(36)}:${Math.random()
        .toString(16)
        .slice(2)}:${_reqCounter}`;
}

export class MicrofrontBus {
    /**
     * @param {EventTarget} target - usually window
     * @param {MicrofrontBusOptions} [options]
     */
    constructor(target, options = {}) {
        const prefix = options.prefix || "";
        this._debug = !!options.debug;
        this._defaultTimeout =
            typeof options.defaultTimeout === "number"
                ? options.defaultTimeout
                : 5000;

        /** @type {DomEventBus} */
        this._domBus = new DomEventBus(
      /** @type any */(target),
            { prefix }
        );

        /** @type {Map<string, RpcHandler>} */
        this._rpcHandlers = new Map();

        /** @type {Map<string, { resolve: Function; reject: Function; timeoutId: any }>} */
        this._pending = new Map();

        // single listener for all RPC requests
        this._unsubscribeRpcRequest = this._domBus.on(
            "__rpc:request",
            (detail) => this._onRpcRequest(detail)
        );

        // single listener for all RPC responses
        this._unsubscribeRpcResponse = this._domBus.on(
            "__rpc:response",
            (detail) => this._onRpcResponse(detail)
        );
    }

    /**
     * INTERNAL: handle incoming RPC request.
     * @param {{ id: string; method: string; params: any }} detail
     * @private
     */
    async _onRpcRequest(detail) {
        const { id, method, params } = detail || {};
        const handler = this._rpcHandlers.get(method);
        if (!handler) {
            if (this._debug) {
                // eslint-disable-next-line no-console
                console.warn(
                    `[MicrofrontBus] no handler registered for RPC method "${method}"`
                );
            }
            this._domBus.emit("__rpc:response", {
                id,
                error: { message: `No handler for method "${method}"` },
            });
            return;
        }

        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] RPC request:", { id, method, params });
        }

        try {
            const result = await handler(params);
            this._domBus.emit("__rpc:response", { id, result });
        } catch (err) {
            if (this._debug) {
                // eslint-disable-next-line no-console
                console.error(
                    `[MicrofrontBus] error in RPC handler "${method}":`,
                    err
                );
            }
            this._domBus.emit("__rpc:response", {
                id,
                error: {
                    // @ts-ignore
                    message: err && err.message ? err.message : "RPC handler error",
                },
            });
        }
    }

    /**
     * INTERNAL: handle incoming RPC response.
     * @param {{ id: string; result?: any; error?: any }} detail
     * @private
     */
    _onRpcResponse(detail) {
        const { id, result, error } = detail || {};
        const pending = this._pending.get(id);
        if (!pending) return;

        this._pending.delete(id);
        clearTimeout(pending.timeoutId);

        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] RPC response:", { id, result, error });
        }

        if (error) {
            pending.reject(error);
        } else {
            pending.resolve(result);
        }
    }

    // ------------------------------------------------------------------
    // One-way broadcast API
    // ------------------------------------------------------------------

    /**
     * Subscribe to a broadcast event.
     *
     * @param {string} eventName
     * @param {EventHandler} handler
     * @returns {() => void} unsubscribe
     */
    onEvent(eventName, handler) {
        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] onEvent:", eventName);
        }
        return this._domBus.on(`evt:${eventName}`, handler);
    }

    /**
     * Subscribe to a broadcast event once.
     *
     * @param {string} eventName
     * @param {EventHandler} handler
     * @returns {() => void} unsubscribe (will already be called after first event)
     */
    onceEvent(eventName, handler) {
        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] onceEvent:", eventName);
        }
        return this._domBus.once(`evt:${eventName}`, handler);
    }

    /**
     * Emit a broadcast event.
     *
     * @param {string} eventName
     * @param {any} [payload]
     */
    emitEvent(eventName, payload) {
        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] emitEvent:", eventName, payload);
        }
        this._domBus.emit(`evt:${eventName}`, payload);
    }

    // ------------------------------------------------------------------
    // Two-way RPC API
    // ------------------------------------------------------------------

    /**
     * Register an RPC handler.
     *
     * @param {string} method
     * @param {RpcHandler} handler
     * @returns {() => void} unregister
     */
    handle(method, handler) {
        if (this._rpcHandlers.has(method)) {
            // eslint-disable-next-line no-console
            console.warn(
                `[MicrofrontBus] overwriting existing handler for method "${method}"`
            );
        }
        this._rpcHandlers.set(method, handler);
        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] handle registered:", method);
        }
        return () => {
            this._rpcHandlers.delete(method);
        };
    }

    /**
     * Perform an RPC request. Returns a Promise.
     *
     * @param {string} method
     * @param {any} [params]
     * @param {{ timeout?: number }} [options]
     * @returns {Promise<any>}
     */
    request(method, params, options = {}) {
        const id = createRequestId();
        const timeoutMs = options.timeout ?? this._defaultTimeout;

        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] RPC request send:", {
                id,
                method,
                params,
                timeoutMs,
            });
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this._pending.delete(id);
                reject({
                    message: `RPC request timeout for method "${method}" after ${timeoutMs}ms`,
                });
            }, timeoutMs);

            this._pending.set(id, { resolve, reject, timeoutId });

            this._domBus.emit("__rpc:request", { id, method, params });
        });
    }

    // ------------------------------------------------------------------
    // Cleanup
    // ------------------------------------------------------------------

    /**
     * Remove all broadcast listeners & RPC handlers, cancel pending requests.
     */
    destroy() {
        if (this._debug) {
            // eslint-disable-next-line no-console
            console.log("[MicrofrontBus] destroy");
        }

        this._domBus.removeAllListeners();

        if (this._unsubscribeRpcRequest) this._unsubscribeRpcRequest();
        if (this._unsubscribeRpcResponse) this._unsubscribeRpcResponse();

        for (const [id, pending] of this._pending.entries()) {
            clearTimeout(pending.timeoutId);
            pending.reject({ message: "Bus destroyed" });
        }
        this._pending.clear();
        this._rpcHandlers.clear();

        this._domBus.destroy();
    }
}
