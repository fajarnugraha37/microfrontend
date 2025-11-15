/**
 * Convenience wrapper for the `product` Pinia bridge store.
 * Exposes `useProduct()` Pinia factory that proxies the Vuex `product` module.
 */
import { createVuexModulePiniaStore } from '../../../bridge/Raptor-Mini/createVuexModulePiniaStore'

/**
 * @returns {import('pinia').StoreDefinition}
 */
export const useProduct = createVuexModulePiniaStore({
	id: 'legacy/product',
	namespace: 'product/',
	mapState: (state) => ({
		products: (state && state.products) || [],
		product: (state && state.product) || null,
	}),
})