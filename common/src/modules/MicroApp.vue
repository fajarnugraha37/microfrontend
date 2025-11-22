<template>
  <section class="micro-app-saas">
    <div class="micro-app-hero">
      <h1 class="micro-app-title">Microfrontend Host</h1>
      <p class="micro-app-subtitle">
        Seamlessly mount remote applications in your SaaS workspace.
      </p>
    </div>

    <div class="micro-app-info-cards">
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Current Route</span>
        <span class="micro-app-info-value">{{ $route.fullPath }}</span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Mount Point</span>
        <span class="micro-app-info-value">
          <code>#micro-app-container</code>
        </span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Status</span>
        <span class="micro-app-info-value">
          {{ statusMessage }}
        </span>
      </div>
    </div>

    <div ref="containerRef" class="micro-app-host-area"></div>
  </section>
</template>

<script>
import { useModuleFederation, mfApps } from '../use-mf';

const LOG_PREFIX = '[MicroAppLoader]';
const isProd = process.env.NODE_ENV === 'production';

function logDebug(...args) {
  if (!isProd) console.debug(LOG_PREFIX, ...args);
}
function logInfo(...args) {
  console.info(LOG_PREFIX, ...args);
}
function logWarn(...args) {
  console.warn(LOG_PREFIX, ...args);
}
function logError(...args) {
  console.error(LOG_PREFIX, ...args);
}

export default {
  name: 'MicroApp',

  data() {
    return {
      currentModule: null, // { name, mount, unmount }
      moduleFederation: null,
      status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
      statusErrorMessage: '',
      _routeWatcherStop: null,
      _loadToken: 0, // race-condition guard
    };
  },

  computed: {
    statusMessage() {
      switch (this.status) {
        case 'loading':
          return 'Loading remote app...';
        case 'ready':
          return 'Remote app mounted';
        case 'error':
          return this.statusErrorMessage || 'Failed to load remote app';
        default:
          return 'Idle';
      }
    },
  },

  created() {
    this.moduleFederation = useModuleFederation();
  },

  mounted() {
    // initial mount
    this.initializeRemote();

    // Vue 2 watch api
    this._routeWatcherStop = this.$watch(
      () => this.$route.fullPath,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          logDebug('route changed from', oldVal, 'to', newVal);
          this.initializeRemote();
        }
      }
    );
  },

  beforeDestroy() {
    // clean watcher
    if (typeof this._routeWatcherStop === 'function') {
      this._routeWatcherStop();
      this._routeWatcherStop = null;
    }
    // ensure unmount
    this.safeUnmountCurrent('component destroy');
  },

  methods: {
    findRouteManifest(routeName) {
      if (!routeName) return null;

      for (let i = 0; i < mfApps.length; i++) {
        const app = mfApps[i];
        const routes = app.routes || [];

        for (let j = 0; j < routes.length; j++) {
          const route = routes[j];
          if (route.name === routeName) {
            return {
              module: app.module,
              entryModule: app.entryModule || './entry',
            };
          }
        }
      }

      return null;
    },

    async safeUnmountCurrent(reason) {
      const current = this.currentModule;
      if (!current) {
        return;
      }

      if (typeof current.unmount !== 'function') {
        logWarn('no unmount() for current module, skipping', current.name);
        this.currentModule = null;
        return;
      }

      try {
        logInfo('unmounting micro app due to:', reason, '->', current.name);
        const maybePromise = current.unmount();
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
      } catch (err) {
        logWarn('error while unmounting micro app:', current.name, err);
      } finally {
        this.currentModule = null;
      }
    },

    async initializeRemote() {
      const routeName = this.$route && this.$route.name;
      const containerEl = this.$refs.containerRef || null;

      if (!containerEl) {
        logError('container ref is not available; aborting mount');
        this.status = 'error';
        this.statusErrorMessage = 'Host container is missing';
        return;
      }

      const mfeConfig = this.findRouteManifest(routeName);

      if (!mfeConfig) {
        logWarn('no MFE config found for route', routeName);
        await this.safeUnmountCurrent('no MFE for this route');
        this.status = 'idle';
        this.statusErrorMessage = '';
        return;
      }

      if (this.currentModule && this.currentModule.name === mfeConfig.module) {
        logDebug('module already mounted for this route:', mfeConfig.module);
        this.status = 'ready';
        this.statusErrorMessage = '';
        return;
      }

      logDebug('resolved MFE config for route', routeName, mfeConfig);
      
      // normalize to 0 if something weird happened
        if (typeof this._loadToken !== 'number' || !isFinite(this._loadToken)) {
          this._loadToken = 0;
        }
      const loadId = ++this._loadToken;
      this.status = 'loading';
      this.statusErrorMessage = '';

      await this.safeUnmountCurrent('switching to new micro app');

      try {
        logInfo('loading remote module:', mfeConfig.module);

        const remoteModule = await this.moduleFederation.loadRemote(mfeConfig);

        // race-condition guard
        if (loadId !== this._loadToken) {
          logWarn(
            'stale load result for',
            mfeConfig.module,
            '- another navigation happened; skipping mount'
          );
          if (remoteModule && typeof remoteModule.unmount === 'function') {
            try {
              remoteModule.unmount();
            } catch (e) {
              logWarn(
                'error unmounting stale remote after race condition:',
                e
              );
            }
          }
          return;
        }

        if (!remoteModule || typeof remoteModule.mount !== 'function') {
          logError(
            'remote module did not provide a valid mount() function:',
            mfeConfig.module
          );
          this.status = 'error';
          this.statusErrorMessage =
            'Remote app is not compatible with host (missing mount).';
          return;
        }

        logInfo('mounting remote module:', mfeConfig.module);

        const mountResult = remoteModule.mount(containerEl, {
          store: window.$__store,
          globalStore: window.globalStore,
          route: this.$route,
        });

        if (mountResult && typeof mountResult.then === 'function') {
          await mountResult;
        }

        this.currentModule = remoteModule;
        this.status = 'ready';
        this.statusErrorMessage = '';

        logInfo('remote module mounted successfully:', mfeConfig.module);
      } catch (err) {
        logError('error loading or mounting remote module:', err);
        this.status = 'error';
        this.statusErrorMessage =
          'Failed to load remote application. Please try again later.';
      }
    },
  },
};
</script>

<style scoped>
/* same styles you had; trimmed for brevity */
.micro-app-saas {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem 2rem 1.5rem 2rem;
  max-width: 900px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.micro-app-hero {
  text-align: center;
  margin-bottom: 2rem;
}

.micro-app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #35495e;
  margin-bottom: 0.5rem;
}

.micro-app-subtitle {
  color: #6b6f76;
  font-size: 1.1rem;
}

.micro-app-info-cards {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.micro-app-info-card {
  background: #f7f9fa;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  padding: 1.25rem 1rem;
  min-width: 180px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.micro-app-info-label {
  font-size: 1rem;
  color: #35495e;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.micro-app-info-value {
  color: #3498db;
  font-size: 1.1rem;
  font-weight: 500;
}

.micro-app-host-area {
  width: 100%;
  min-height: 240px;
  border: 2px dashed #bfc3c9;
  border-radius: 10px;
  background: #f7f9fa;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
