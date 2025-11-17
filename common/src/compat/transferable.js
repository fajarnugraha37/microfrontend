import Vue from 'vue';
import Router from 'vue-router';
import Vuex from 'vuex';

window.Vue = Vue;
window.VueRouter = Router;
window.Vuex = Vuex;

const origUse = Vue.use
const origMixin = Vue.mixin
const origDirective = Vue.directive
const origFilter = Vue.filter

window.$__pluginRegistry = []
window.$__mixinRegistry = []
window.$__directiveRegistry = []
window.$__filterRegistry = []

Vue.use = function (plugin, ...args) {
    // check for duplicates?
    if (window.$__pluginRegistry.some(item => item.plugin.name === plugin.name)) {
        return this;
    }
    window.$__pluginRegistry.push({ plugin, args })
    return origUse.call(this, plugin, ...args)
}
Vue.mixin = function (mixin) {
    // check for duplicates?
    if (window.$__mixinRegistry.includes(mixin)) {
        return this;
    }
    window.$__mixinRegistry.push(mixin)
    return origMixin.call(this, mixin)
}
Vue.directive = function (name, def) {
    // check for duplicates?
    if (window.$__directiveRegistry.some(item => item.name === name)) {
        return this;
    }
    if (def) {
        window.$__directiveRegistry.push({ name, def })
    }
    return origDirective.call(this, name, def)
}
Vue.filter = function (name, fn) {
    // check for duplicates?
    if (window.$__filterRegistry.some(item => item.name === name)) {
        return this;
    }
    if (fn) {
        window.$__filterRegistry.push({ name, fn })
    }
    return origFilter.call(this, name, fn)
}