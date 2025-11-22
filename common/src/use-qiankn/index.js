export * from "./state";

import Vue from 'vue';
import { registerMicroApps, addGlobalUncaughtErrorHandler, addErrorHandler, start } from 'qiankun';

/**
 * @type {(import('qiankun').RegistrableApp<any> & { routes: import('vue-router').RouteConfig[] })[]}
 */
export const qiankunApps = [
    {
        name: 'app-dashboard',
        entry: '//localhost:8081',
        container: '#micro-app-container',
        activeRule: '/dashboard',
        props: {
            getStore: () => window.$__store,
        },
        routes: [
            {
                path: '/dashboard',
                name: 'dashboard-root',
                component: () => import("../modules/MicroAppHost.vue"),
                meta: { requiresAuth: true },
            },
            {
                path: '/dashboard/:path*',
                name: 'dashboard-mfe',
                component: () => import("../modules/MicroAppHost.vue"),
                meta: { requiresAuth: true },
            },
        ],
    },
];


qiankun();
function qiankun() {
    if (window.qiankunStarted === true) {
        console.warn('[qiankun] already started, skipping initialization.');
        return;
    }

    /** 
     * @type {import('qiankun').FrameworkLifeCycles<any>} 
     * */
    const lifecycle = {
        beforeLoad: [
            (appConfig) => {
                console.info(`[qiankun] before load -> ${appConfig.name}`);
                return Promise.resolve();
            }
        ],
        beforeMount: [
            (appConfig) => {
                console.info(`[qiankun] before mount -> ${appConfig.name}`);
                return Promise.resolve();
            }
        ],
        afterUnmount: [
            (appConfig) => {
                console.info(`[qiankun] after unmount -> ${appConfig.name}`);
                return Promise.resolve();
            }
        ]
    }

    addGlobalUncaughtErrorHandler((event) => {
        console.error('[qiankun] global error', event);
    });

    addErrorHandler((err) => {
        console.error('[qiankun] error', err);
    });

    registerMicroApps(qiankunApps, lifecycle);

    Vue.nextTick(() => {
        if (!window.qiankunStarted) {
            start();
            window.qiankunStarted = true;
        }
    });
}