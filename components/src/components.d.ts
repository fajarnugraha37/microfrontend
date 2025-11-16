// Merged into global.d.ts - keep placeholder to avoid duplicate declarations being an issue
declare module '*.vue' {
  import Vue from 'vue';
  import { ComponentOptions } from 'vue';
  const component: ComponentOptions<Vue>;
  export default component;
}
