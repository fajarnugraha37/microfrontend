import { createInstance } from '@module-federation/runtime';

export const mfApps = [
    {
        module: 'app-profile',                           // 👈 MUST exist
        // entry: 'http://localhost:8082/remoteEntry.js',
        entry: 'http://localhost:8082/mf-manifest.json',
        entryModule: 'entry',                          // exposed module name
        routes: [
            {
                path: '/profile/:path*',
                name: 'profile-mfe',
                component: () => import('../modules/MicroApp.vue'),
                meta: { requiresAuth: true },
                props: { renderType: 'module-federation' },
            },
        ],
    },
];

export const mfShared = {
    "vue": {
        lib: () => import('vue'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
    "vuex": {
        lib: () => import('vuex'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
    "vuex-persistedstate": {
        lib: () => import('vuex-persistedstate'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
    "vue-router": {
        lib: () => import('vue-router'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
    "vee-validate": {
        lib: () => import('vee-validate'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
    "mfe-components": {
        lib: () => import('mfe-components'),
        scope: "default",
        shareConfig: {
            singleton: true,
        },
    },
};

/**
 * Initialize module federation runtime with all remotes from mfApps.
 * Call this ONCE at app bootstrap (e.g. in main.js).
 */
const instance = (() => {
    const remotes = mfApps.map((app) => ({
        name: app.module,
        entry: app.entry,
        type: 'module', // Vite remotes are ESM modules :contentReference[oaicite:0]{index=0}
    }));
    if (process.env.NODE_ENV !== 'production') {
        console.info('[mf] runtime initialized with remotes:', remotes);
    }

    const _instance = createInstance({
        id: 'host',
        name: 'host',
        remotes: remotes,
        shared: mfShared
    });

    return _instance;
})();

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

            return {
                name: moduleName,
                mount: loadedModule.mount,
                unmount: loadedModule.unmount,
            };
        } catch (err) {
            console.error('[mf] failed to load remote', remoteId, err);
            throw err;
        }
    }

    return { loadRemote };
}
