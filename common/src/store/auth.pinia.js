/**
 * Convenience wrapper for the `auth` Pinia bridge store.
 * This uses the runtime bridge to expose a `useAuth()` Pinia factory that proxies the Vuex `auth` module.
 */
import { createVuexModulePiniaStore } from '../../../bridge/Raptor-Mini/createVuexModulePiniaStore'

/**
 * @returns {import('pinia').StoreDefinition}
 */
export const useAuth = createVuexModulePiniaStore({
	id: 'legacy/auth',
	namespace: 'auth/',
	mapState: (state) => ({
		token: state ? state.token : '',
		user: state ? state.user : null,
	}),
})