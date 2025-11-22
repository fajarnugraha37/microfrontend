import VeeValidate, { Validator } from "vee-validate";

// custom validator rules import
import passwordValidator from "./extensions/passwordValidator";
import fileFormatValidator from "./extensions/fileFormatValidator";
import fileNumberValidator from "./extensions/fileNumberValidator";
import fileSizeValidator from "./extensions/fileSizeValidator";
import nricValidator from "./extensions/nricValidator";
import finValidator from "./extensions/finValidator";
import uenValidator from "./extensions/uenValidator";
import nricFinValidator from "./extensions/nricAndFinValidator";
import sgNumberValidator from "./extensions/sgNumberValidator";

// dictionary
import dictionary from "./dictionary";

export const useValidators = (vue) => {
    vue.use({
        version: 'vue-2',
        type: 'global',
        name: 'Validator-Vee-Validate-2',

        install(app, options) {
            if (!app?.config?.globalProperties) {
                console.log('[vee-validate] Setting up vee-validate v2 with custom rules');
                // Vue use vee-validate package
                vue.use(VeeValidate);

                Validator.localize(dictionary);

                // Extend validator to use custom validator rule
                Validator.extend("validPassword", passwordValidator);
                Validator.extend("fileNumber", fileNumberValidator);
                Validator.extend("fileSize", fileSizeValidator);
                Validator.extend("fileFormat", fileFormatValidator);
                Validator.extend("nric", nricValidator);
                Validator.extend("fin", finValidator);
                Validator.extend("uen", uenValidator);
                Validator.extend("nric_fin", nricFinValidator);
                Validator.extend("sgNumber", sgNumberValidator);
            } else {
                const { veeValidate, rules, localize } = options || {};
                console.log('[vee-validate] Setting up vee-validate v4 with custom rules', veeValidate, rules, localize);
                if (veeValidate && rules) {
                    console.log('[vee-validate] Setting up vee-validate custom rules');
                    Object.entries(rules).forEach(([name, rule]) => {
                        veeValidate.defineRule(name, rule);
                    });
                    veeValidate.defineRule("validPassword", passwordValidator);
                    veeValidate.defineRule("fileNumber", fileNumberValidator);
                    veeValidate.defineRule("fileSize", fileSizeValidator);
                    veeValidate.defineRule("fileFormat", fileFormatValidator);
                    veeValidate.defineRule("nric", nricValidator);
                    veeValidate.defineRule("fin", finValidator);
                    veeValidate.defineRule("uen", uenValidator);
                    veeValidate.defineRule("nric_fin", nricFinValidator);
                    veeValidate.defineRule("sgNumber", sgNumberValidator);
                    if (localize) {
                        console.log('[vee-validate] Setting up vee-validate localization');
                        veeValidate.configure({
                            generateMessage: localize('en', dictionary.en),
                        });
                    } else {
                        console.warn('[vee-validate] localization function not provided in options');
                    }
                } else {
                    console.warn('[vee-validate] vv4 or rules not provided in options');
                }
            }
        }
    });
}