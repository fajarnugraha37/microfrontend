import { ProductService } from '../services/product';

const state = {
  products: [],
  product: null,
};

const mutations = {
  setProducts(state, products) {
    state.products = products;
  },
  setProduct(state, product) {
    state.product = product;
  },
};

const actions = {
  async fetchProducts({ commit }) {
    const service = ProductService();
    const res = await service.getProducts();
    commit('setProducts', res.data.products);
  },
  async fetchProduct({ commit }, id) {
    const service = ProductService();
    const res = await service.getProduct(id);
    commit('setProduct', res.data);
  },
};

export const productStore = {
  namespaced: true,
  state,
  mutations,
  actions,
};
