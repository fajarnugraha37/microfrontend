import configMixin from "./configMixin";
import globalStateMixin from "./globalStateMixin";
import productMixin from "./productMixin";
import userMixin from "./userMixin";

export const useMixins = (vue) => {
    vue.mixin(configMixin);
    vue.mixin(globalStateMixin);
    vue.mixin(productMixin);
    vue.mixin(userMixin);
}