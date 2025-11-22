// Unified mixin for auth, config, and global state integration
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex';
import { globalActions } from '../use-qiankn';

export default {
  computed: {
    ...mapGetters(['isAuthenticated', 'username']),
    ...mapState(['user', 'token']),
    globalUser() {
      return this.user || (globalActions.getGlobalState().user || null);
    },
    globalToken() {
      return this.token || (globalActions.getGlobalState().token || null);
    },
    globalConfig() {
      return this.$store.state.config || (globalActions.getGlobalState().config || null);
    }
  },
  methods: {
    ...mapActions(['login', 'logout']),
    ...mapMutations(['increment', 'decrement']),
    setGlobalState(state) {
      globalActions.setGlobalState(state);
    },
    syncAuthToLocalStorage() {
      if (this.globalToken) {
        localStorage.setItem('auth_token', this.globalToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    },
    async loadAppConfig() {
      const config = await this.$utils.loadConfig();
      this.$store.commit('setConfig', config);
      this.setGlobalState({ config });
    },
    unifiedLogin(payload) {
      this.login(payload);
      this.setGlobalState({ user: payload.user, token: payload.token, lastLogin: payload.user.lastLogin });
      localStorage.setItem('auth_token', payload.token);
    },
    unifiedLogout() {
      // Call Vuex logout action directly to avoid recursion
      if (this.$store && typeof this.$store.dispatch === 'function') {
        this.$store.dispatch('logout');
      }
      this.setGlobalState({ user: null, token: null, lastLogin: null });
      localStorage.removeItem('auth_token');
    }
  },
  mounted() {
    // Sync Vuex and global state on mount
    if (this.user && this.token) {
      this.setGlobalState({ user: this.user, token: this.token, lastLogin: this.user.lastLogin || null });
      this.syncAuthToLocalStorage();
    }
  }
};
