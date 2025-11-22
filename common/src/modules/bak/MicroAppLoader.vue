<template>
  <section class="micro-app-saas">
    <div class="micro-app-hero">
      <h1 class="micro-app-title">Microfrontend Host</h1>
      <p class="micro-app-subtitle">Seamlessly mount remote applications in your SaaS workspace.</p>
    </div>
    <div class="micro-app-info-cards">
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Current Route</span>
        <span class="micro-app-info-value">{{ $route.fullPath }}</span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Mount Point</span>
        <span class="micro-app-info-value"><code>#micro-app-container</code></span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Status</span>
        <span class="micro-app-info-value">Ready to render remote app</span>
      </div>
    </div>
    <div ref="containerRef"></div>
  </section>
</template>
``
<script>
import { useModuleFederation } from '../../use-mf';
import { mfApps } from '../../use-mf';

export default {
  name: 'MicroAppLoader',
  data() {
    return {
      currentModule: null,
      moduleFederation: null,
    };
  },
  created() {
    // initialize module federation utility
    this.moduleFederation = useModuleFederation();
  },
  mounted() {
    this.initializeRemote();
    // Watch for route changes
    this.$watch(
      () => this.$route.name,
      (newRouteName, oldRouteName) => {
        console.log('Route changed from', oldRouteName, 'to', newRouteName);
        if (newRouteName !== oldRouteName) {
          this.initializeRemote();
        }
      }
    );
  },
  destroyed() {
    // Unmount current MFE on component destroy (Vue 2 lifecycle)
    if (this.currentModule && typeof this.currentModule.unmount === 'function') {
      try {
        console.log('Unmounting micro app on component destroy:', this.currentModule.name);
        this.currentModule.unmount();
        this.currentModule = null;
      } catch (err) {
        console.warn('Error unmounting micro app on destroy:', err);
      }
    }
  },
  methods: {
    findRouteManifest(routeName) {
      console.log('Finding route manifest for:', routeName);
      return mfApps.find(app => {
        console.log('Checking app routes for:', app);
        return app.routes.some(route => route.name === routeName);
      }) || null;
    },
    async loadRemote(mfeConfig) {
      console.log('Loading remote module:', mfeConfig && mfeConfig.module);
      if (!mfeConfig || !mfeConfig.module) {
        console.error('Invalid MFE configuration:', mfeConfig);
        return;
      }

      // If we're loading the same module, don't reload
      if (this.currentModule && this.currentModule.name === mfeConfig.module) {
        console.log('Module already loaded:', mfeConfig.module);
        return;
      }

      // Unmount previous MFE
      if (this.currentModule && typeof this.currentModule.unmount === 'function') {
        try {
          console.log('Unmounting previous micro app:', this.currentModule.name);
          await Promise.resolve(this.currentModule.unmount());
          console.log('Successfully unmounted previous micro app:', this.currentModule.name);
        } catch (err) {
          console.warn('Error unmounting previous micro app:', err);
        }
      }

      try {
        console.log('Loading remote module:', mfeConfig && mfeConfig.module);
        const remoteModule = await this.moduleFederation.loadRemote(mfeConfig);
        const containerEl = this.$refs.containerRef || null;

        if (!containerEl) {
          console.error('Container ref is not available');
          return;
        }

        if (remoteModule && typeof remoteModule.mount === 'function') {
          console.log('Mounting remote module:', mfeConfig.module, 'to element:', containerEl);
          // Pass both the element and props (host store, etc.)
          const mountPromise = remoteModule.mount(containerEl, {
            store: window.$__store,
            globalStore: window.globalStore,
          });
          // Wait for mount to complete
          if (mountPromise && typeof mountPromise.then === 'function') {
            await mountPromise;
          }
        }
        console.log('Remote module loaded and mounted:', mfeConfig.module);
        this.currentModule = {
          name: mfeConfig.module,
          mount: remoteModule && remoteModule.mount,
          unmount: remoteModule && remoteModule.unmount,
        };
      } catch (error) {
        console.error('Error loading remote module:', error);
      }
    },
    initializeRemote() {
      try {
        const routeName = this.$route.name;
        console.log('Initializing remote for route:', routeName);
        const routeConfig = this.findRouteManifest(routeName);
        if (!routeConfig) {
          console.error('Route manifest not found for', routeName);
          return;
        }
        if (routeConfig && routeConfig.module) {
          console.log('Found module config for route:', routeConfig);
          this.loadRemote(routeConfig);
        } else {
          console.warn('No module configured for route:', routeName);
        }
      } catch (err) {
        console.error('initializeRemote error:', err);
      }
    },
  },
};
</script>

<style scoped>
.micro-app-saas {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
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