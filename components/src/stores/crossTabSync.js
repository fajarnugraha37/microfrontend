// @ts-check
/**
 * Cross-tab sync helper: BroadcastChannel with localStorage fallback.
 * Note: Use structured clone via BroadcastChannel where available; fallback to localStorage events.
 */

/** @typedef {{ channelName?: string, throttleMs?: number, enableLocalStorageFallback?: boolean }} CrossTabOptions */

function now() {
    return Date.now();
}

function createId() {
    return `${now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{ $id: any; $patch: (arg0: any) => void; $subscribe: (arg0: ({ storeId, type }: { storeId: any; type: any; }, state: any) => void) => any; }} store
 * @param {{ channelName: any; throttleMs: any; enableLocalStorageFallback: any; }} options
 */
export function setupCrossTabSync(store, options) {
    const channelName = options.channelName || `mfe-pinia-sync`;
    const throttleMs = typeof options.throttleMs === 'number' ? options.throttleMs : 100;
    const enableLocalStorageFallback = options.enableLocalStorageFallback ?? true;

    const senderId = createId();
    let syncingFromBroadcast = false;
    /** @type {null | ReturnType<typeof setTimeout>} */
    let lastTimeout = null;
    let closed = false;

    // Broadcast channel if available
    /** @type {null | BroadcastChannel} */
    let bc = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            bc = new BroadcastChannel(channelName);
        }
    } catch (e) {
        bc = null;
    }

    /**
     * 
     * @param {Record<string, any>} msg 
     * @returns 
     */
    function handleMessage(msg) {
        try {
            const { originId, storeId, payload } = msg || {};
            if (!originId || originId === senderId) return;
            if (storeId && storeId !== store.$id) return;
            // mark and apply
            syncingFromBroadcast = true;
            // apply patch safely
            if (payload) store.$patch(payload);
        } catch (e) {
            // ignore
            // eslint-disable-next-line no-console
            console.warn('[CrossTab] invalid message', e);
        } finally {
            syncingFromBroadcast = false;
        }
    }

    if (bc) {
        bc.onmessage = (ev) => handleMessage(ev.data);
    }

    /**
     * 
     * @param {StorageEvent} ev 
     * @returns 
     */
    function handleStorage(ev) {
        if (!ev.key) return;
        if (!ev.newValue) return;
        if (ev.key !== channelName) return;
        try {
            const data = JSON.parse(ev.newValue);
            handleMessage(data);
        } catch (e) {
            // ignore
        }
    }

    if (!bc && enableLocalStorageFallback && typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorage);
    }

    // debounce broadcast for throttleMs
    /**
     * 
     * @param {Record<any, string>} payload 
     * @returns 
     */
    function triggerBroadcast(payload) {
        if (closed) return;
        if (lastTimeout) clearTimeout(lastTimeout);
        lastTimeout = setTimeout(() => {
            const message = { originId: senderId, storeId: store.$id, payload };
            if (bc) {
                try { bc.postMessage(message); } catch (e) { /* ignore */ }
            }
            if (enableLocalStorageFallback && typeof window !== 'undefined') {
                try { window.localStorage.setItem(channelName, JSON.stringify(message)); } catch (e) { /* ignore */ }
            }
            lastTimeout = null;
        }, throttleMs);
    }

    // subscribe to store changes
    const unsubscribe = store.$subscribe(({ storeId, type }, state) => {
        if (syncingFromBroadcast) return; // avoid echo
        try {
            // simple: broadcast whole state - optimize later by diffing
            const payload = state; // state is reactive object; structured clone by BC or stringify in fallback
            triggerBroadcast(payload);
        } catch (e) {
            // ignore
        }
    });

    return function dispose() {
        closed = true;
        if (bc) {
            try { bc.close(); } catch (e) { /* ignore */ }
        }
        if (enableLocalStorageFallback && typeof window !== 'undefined') {
            try { window.removeEventListener('storage', handleStorage); } catch (e) { /* ignore */ }
        }
        try { if (unsubscribe) unsubscribe(); } catch (e) { /* ignore */ }
    };
}
