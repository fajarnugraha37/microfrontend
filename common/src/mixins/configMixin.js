/**
 * Mixin to load config.json and inject to store
 */
export default {
  data() {
    return {
      config: null,
      configLoaded: false,
    };
  },
  async created() {
    if (!this.configLoaded) {
      try {
        const cfg = await this.$utils.loadConfig();
        this.config = cfg;
        this.configLoaded = true;
        if (this.$store) {
          this.$store.commit('setConfig', cfg);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load config.json', e);
      }
    }
  }
};
