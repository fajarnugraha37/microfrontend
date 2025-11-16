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
    vue.use(new class CustomValidatorPlugin {
        version = 'vue-2';
        type = 'global';
        name = 'Validator-Vee-Validate-2';

        install(Vue) {
            // Vue use vee-validate package
            Vue.use(VeeValidate);

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
        }
    });
}