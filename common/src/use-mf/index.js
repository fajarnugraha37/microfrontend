import { createInstance } from '@module-federation/runtime';

export const mfApps = [
    {
        module: 'app-profile',                           // 👈 MUST exist
        entry: 'http://localhost:8082/remoteEntry.js',
        entryModule: 'entry',                          // exposed module name
        routes: [
            {
                path: '/profile',
                name: 'profile-root',
                component: () => import('../modules/MicroAppLoader.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: '/profile/:path*',
                name: 'profile-mfe',
                component: () => import('../modules/MicroAppLoader.vue'),
                meta: { requiresAuth: true },
            },
        ],
    },
];

/**
 * Initialize module federation runtime with all remotes from mfApps.
 * Call this ONCE at app bootstrap (e.g. in main.js).
 */
const remotes = mfApps.map((app) => ({
    name: app.module,
    entry: app.entry,
    type: 'module', // Vite remotes are ESM modules :contentReference[oaicite:0]{index=0}
}));

const instance = createInstance({
    name: 'host',
    remotes,
});


if (process.env.NODE_ENV !== 'production') {
    console.info('[mf] runtime initialized with remotes:', remotes);
}

/**
 * Wrapper around @module-federation/runtime.loadRemote
 * Accepts a single app config object from mfApps.
 */
export function useModuleFederation() {
    async function loadRemote(mfeConfig) {
        if (!mfeConfig || !mfeConfig.module) {
            throw new Error('[mf] loadRemote: invalid micro app config');
        }

        const moduleName = mfeConfig.module;
        const expose = (mfeConfig.entryModule || './entry').replace(/^\.\//, ''); // "./entry" -> "entry"
        const remoteId = `${moduleName}/${expose}`; // e.g. "app-profile/entry"

        try {
            const loadedModule = await instance.loadRemote(remoteId);

            if (!loadedModule || typeof loadedModule.mount !== 'function') {
                throw new Error(
                    `[mf] remote "${remoteId}" does not export a valid mount(container, props) function`
                );
            }

            const unmountFn =
                typeof loadedModule.unmount === 'function'
                    ? loadedModule.unmount
                    : undefined;

            return {
                name: moduleName,
                mount: loadedModule.mount,
                unmount: unmountFn,
            };
        } catch (err) {
            console.error('[mf] failed to load remote', remoteId, err);
            throw err;
        }
    }

    return { loadRemote };
}
