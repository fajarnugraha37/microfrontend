import configMixin from "./configMixin";
import globalStateMixin from "./globalStateMixin";
import productMixin from "./productMixin";
import userMixin from "./userMixin";

export const useMixins = (vue) => {
    vue.use(new class CustomMixinPlugin {
        install(Vue) {
            Vue.mixin(configMixin);
            Vue.mixin(globalStateMixin);
            Vue.mixin(productMixin);
            Vue.mixin(userMixin);
        }
    });
}