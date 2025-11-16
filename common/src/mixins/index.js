import configMixin from "./configMixin";
import globalStateMixin from "./globalStateMixin";
import productMixin from "./productMixin";
import userMixin from "./userMixin";

export const useMixins = (vue) => {
    vue.use(new class CustomMixinPlugin {
        version = 'vue-2';
        type = 'global';
        name = 'Global-Mixins';

        install(Vue) {
            Vue.mixin(configMixin);
            Vue.mixin(globalStateMixin);
            Vue.mixin(productMixin);
            Vue.mixin(userMixin);
        }
    });
}