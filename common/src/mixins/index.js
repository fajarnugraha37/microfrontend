import configMixin from "./configMixin";
import globalStateMixin from "./globalStateMixin";
import productMixin from "./productMixin";
import userMixin from "./userMixin";

const mixins = window.legacyMixins = {
    configMixin,
    configMixin,
    globalStateMixin,
    productMixin,
    userMixin
}

export const useMixins = (vue) => {
    vue.use(new class CustomMixinPlugin {
        version = 'vue-2';
        type = 'global';
        name = 'Global-Mixins';

        install(app) {
            if (!app?.config?.globalProperties) {
                app.prototype.$legacyMixins = mixins;
                for (const mixin of Object.values(mixins)) {
                    app.mixin(mixin);
                }
            } else {
                app.config.globalProperties.$legacyMixins = mixins;
                for (const mixin of Object.values(mixins)) {
                    app.config.globalProperties.$store = window.store
                    console.log("Mixin applied:", mixin, app.config.globalProperties, Object.keys(app.config.globalProperties));
                    for (const key of Object.keys(app.config.globalProperties)) {
                        mixin[key] = app.config.globalProperties[key];
                    }
                    app.mixin(mixin);
                }
                app.mixin(({
                    methods: {
                        randomMethod(msg) {
                        console.log("[randomMethod]", msg);
                        },
                    },
                }));
            }
        }
    });
}