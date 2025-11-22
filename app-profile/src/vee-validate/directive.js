// @ts-check
import { reactive, inject } from 'vue';
import { validate as vvValidate } from 'vee-validate';

/**
 * @typedef {Object} FieldConfig
 * @property {string} name
 * @property {string | null} scope
 * @property {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} el
 * @property {string | Object | Function} rules
 * @property {string[]} events
 */

/**
 * @typedef {Object} ValidationErrorsHelper
 * @property {(name: string, scope?: string | null) => string | undefined} first
 * @property {(name: string, scope?: string | null) => boolean} has
 * @property {(scope?: string | null) => Record<string, string[]>} all
 * @property {(name?: string, scope?: string | null) => void} clear
 */

/**
 * @typedef {Object} ValidatorApi
 * @property {(name: string, scope?: string | null) => Promise<boolean>} validate
 * @property {(scope?: string | null) => Promise<boolean>} validateAll
 * @property {(name?: string, scope?: string | null) => void} reset
 * @property {ValidationErrorsHelper} errors
 */

export function veeValidateDirectivePlugin() {
  /** @type {Map<string, FieldConfig>} */
  const fields = new Map();
  /** @type {WeakMap<Element, string>} */
  const elToFieldName = new WeakMap();
  /** @type {WeakMap<Element, { event: string; handler: (e: Event) => void }[]>} */
  const elListeners = new WeakMap();

  // errors[scopeKey][fieldName] = string[]
  /** @type {Record<string, Record<string, string[]>>} */
  const errorsState = reactive({});

  const GLOBAL_SCOPE = '__global__';

  /**
   * @param {string | null | undefined} scope
   */
  function scopeKey(scope) {
    return scope || GLOBAL_SCOPE;
  }

  /**
   * @param {string} name
   * @param {string | null} scope
   * @param {string[]} errs
   */
  function setFieldErrors(name, scope, errs) {
    const sKey = scopeKey(scope);
    if (!errorsState[sKey]) {
      errorsState[sKey] = {};
    }

    if (errs && errs.length) {
      errorsState[sKey][name] = errs;
    } else if (
      errorsState[sKey] &&
      Object.prototype.hasOwnProperty.call(errorsState[sKey], name)
    ) {
      delete errorsState[sKey][name];
      if (!Object.keys(errorsState[sKey]).length) {
        delete errorsState[sKey];
      }
    }
  }

  /**
   * @param {string} name
   * @param {string | null} [scope]
   */
  async function validateField(name, scope) {
    const key = `${scopeKey(scope)}::${name}`;
    const field = fields.get(key);
    if (!field) return true;

    const el = field.el;
    let value;

    if (el.type === 'checkbox') {
      value = el.checked;
    } else if (el.type === 'radio') {
      const group = document.querySelector(
        `input[type="radio"][name="${CSS.escape(field.name)}"]:checked`
      );
      value = /** @type {HTMLInputElement|null} */ (group)?.value ?? '';
    } else {
      value = el.value;
    }

    const result = await vvValidate(value, field.rules, {
      name: field.name,
    });

    setFieldErrors(field.name, field.scope, result.errors || []);

    return !!result.valid;
  }

  /**
   * @param {string | null} [scope]
   */
  async function validateAll(scope) {
    /** @type {Promise<boolean>[]} */
    const tasks = [];

    for (const field of fields.values()) {
      if (scope != null && field.scope !== scope) continue;
      tasks.push(validateField(field.name, field.scope));
    }

    const results = await Promise.all(tasks);
    return results.every(Boolean);
  }

  /**
   * @param {string} [name]
   * @param {string | null} [scope]
   */
  function reset(name, scope) {
    if (name) {
      const sKey = scopeKey(scope);
      if (errorsState[sKey]) {
        delete errorsState[sKey][name];
        if (!Object.keys(errorsState[sKey]).length) {
          delete errorsState[sKey];
        }
      }
      return;
    }

    if (scope != null) {
      const sKey = scopeKey(scope);
      delete errorsState[sKey];
    } else {
      Object.keys(errorsState).forEach((sk) => {
        delete errorsState[sk];
      });
    }
  }

  /** @type {ValidationErrorsHelper} */
  const errorsHelper = {
    first(name, scope) {
      if (scope != null) {
        const sKey = scopeKey(scope);
        const list = errorsState[sKey]?.[name];
        return list && list.length ? list[0] : undefined;
      }

      // no scope: search all scopes
      for (const sKey of Object.keys(errorsState)) {
        const list = errorsState[sKey]?.[name];
        if (list && list.length) return list[0];
      }
      return undefined;
    },

    has(name, scope) {
      return !!this.first(name, scope);
    },

    all(scope) {
      if (scope != null) {
        const sKey = scopeKey(scope);
        return errorsState[sKey] || {};
      }
      // merged view: flatten all scopes
      /** @type {Record<string, string[]>} */
      const merged = {};
      for (const sKey of Object.keys(errorsState)) {
        const map = errorsState[sKey];
        Object.keys(map).forEach((name) => {
          merged[name] = map[name];
        });
      }
      return merged;
    },

    clear(name, scope) {
      reset(name, scope);
    },
  };

  /** @type {ValidatorApi} */
  const validatorApi = {
    validate: validateField,
    validateAll,
    reset,
    errors: errorsHelper,
  };

  function resolveEvents(binding) {
    const modifiers = binding.modifiers || {};
    const modKeys = Object.keys(modifiers);
    if (!modKeys.length) {
      return ['input', 'blur'];
    }
    return modKeys;
  }

  function resolveFieldName(el, binding) {
    if (binding.arg) return String(binding.arg);
    const vvNameAttr = el.getAttribute('data-vv-name');
    if (vvNameAttr) return vvNameAttr;
    const nameAttr = el.getAttribute('name');
    if (nameAttr) return nameAttr;
    return null;
  }

  /**
   * resolve scope:
   *  - data-vv-scope on closest form
   *  - or form[name] / form[id]
   *  - or null (global)
   * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} el
   * @returns {string | null}
   */
  function resolveScope(el) {
    const form = el.closest('form');
    if (!form) return null;

    const explicit = form.getAttribute('data-vv-scope');
    if (explicit) return explicit;

    const nameAttr = form.getAttribute('name');
    if (nameAttr) return nameAttr;

    const idAttr = form.getAttribute('id');
    if (idAttr) return idAttr;

    return null;
  }

  function resolveRules(binding) {
    const val = binding.value;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // @ts-ignore
      return val.rules || '';
    }
    return val;
  }

  function registerField(el, binding) {
    const name = resolveFieldName(el, binding);
    if (!name) {
      if (import.meta.env?.DEV) {
        console.warn('[v-validate] cannot determine field name for', el);
      }
      return;
    }

    const scope = resolveScope(el);
    const rules = resolveRules(binding);
    const events = resolveEvents(binding);

    const key = `${scopeKey(scope)}::${name}`;
    const cfg = /** @type {FieldConfig} */ ({ name, scope, el, rules, events });
    fields.set(key, cfg);
    elToFieldName.set(el, key);

    const listeners = [];

    events.forEach((eventName) => {
      const handler = () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        validateField(name, scope);
      };
      el.addEventListener(eventName, handler);
      listeners.push({ event: eventName, handler });
    });

    elListeners.set(el, listeners);
  }

  function updateField(el, binding) {
    const key = elToFieldName.get(el);
    if (!key) {
      registerField(el, binding);
      return;
    }

    const field = fields.get(key);
    if (!field) {
      registerField(el, binding);
      return;
    }

    const newRules = resolveRules(binding);
    field.rules = newRules;

    const newEvents = resolveEvents(binding);
    const oldEventsKey = field.events.join(',');
    const newEventsKey = newEvents.join(',');
    if (oldEventsKey !== newEventsKey) {
      const listeners = elListeners.get(el) || [];
      listeners.forEach((l) => {
        el.removeEventListener(l.event, l.handler);
      });

      const freshListeners = [];
      newEvents.forEach((eventName) => {
        const handler = () => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          validateField(field.name, field.scope);
        };
        el.addEventListener(eventName, handler);
        freshListeners.push({ event: eventName, handler });
      });

      field.events = newEvents;
      elListeners.set(el, freshListeners);
    }
  }

  function unregisterField(el) {
    const key = elToFieldName.get(el);
    if (!key) return;

    const field = fields.get(key);
    if (!field) return;

    const listeners = elListeners.get(el) || [];
    listeners.forEach((l) => {
      el.removeEventListener(l.event, l.handler);
    });
    elListeners.delete(el);

    fields.delete(key);
    setFieldErrors(field.name, field.scope, []);
    elToFieldName.delete(el);
  }

  /** @type {import('vue').Directive} */
  const ValidateDirective = {
    mounted(el, binding) {
      registerField(
        /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (el),
        binding
      );
    },
    updated(el, binding) {
      updateField(
        /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (el),
        binding
      );
    },
    unmounted(el) {
      unregisterField(
        /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (el)
      );
    },
  };

  return {
    /**
     * @param {import('vue').App} app
     */
    install(app) {
      app.directive('validate', ValidateDirective);

      app.config.globalProperties.errors = errorsHelper;
      app.config.globalProperties.$validator = validatorApi;

      app.provide('errors', errorsHelper);
      app.provide('validator', validatorApi);
    },
  };
}

/**
 * @returns {{ errors: ValidationErrorsHelper, validator: ValidatorApi }}
 */
export function useValidator() {
  /** @type {ValidationErrorsHelper | undefined} */
  const errors = inject('errors');
  /** @type {ValidatorApi | undefined} */
  const validator = inject('validator');

  if (!errors || !validator) {
    throw new Error(
      '[v-validate-plugin] useValidator() used without installing validation plugin'
    );
  }

  return { errors, validator };
}
