import ValidationObserver from "./ValidationObserver.vue";
import ValidationProvider from "./ValidationProvider.vue";

export const veeValidateCompatPlugin = {
    version: 'vue-3',
    type: 'global',
    name: 'Vee-Validate-Compat',
    install(app) {
        app.component('ValidationObserver', ValidationObserver);
        app.component('ValidationProvider', ValidationProvider);
    },
};

export * from "./directive";
export * from 'vee-validate';
