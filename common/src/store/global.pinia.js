/**
 * Convenience wrapper for the `global` Pinia bridge store.
 * This maps the root Vuex state for easier access in Pinia-based microapps.
 */
import { createVuexModulePiniaStore } from '../../../bridge/Raptor-Mini/createVuexModulePiniaStore'

/**
 * @returns {import('pinia').StoreDefinition}
 */
export const useGlobal = createVuexModulePiniaStore({
	id: 'legacy/root',
	namespace: '<root>',
	mapState: (state) => ({
		token: state ? state.token : null,
		user: state ? state.user : null,
		config: state ? state.config : null,
	}),
})