/**
 * Product mixin for fetching and searching products
 */
import { ProductService } from '../services/product';
export default {
  data() {
    return {
      products: [],
      limit: 30,
      skip: 0,
      total: 0,
      product: null,
      searchQuery: ''
    };
  },
  methods: {
    async fetchProducts(params) {
      const service = ProductService();
      const res = await service.getProducts(params);
      this.products = res.data.products;
    },
    async fetchProduct(id) {
      const service = ProductService();
      const res = await service.getProduct(id);
      this.product = res.data;
    },
    async searchProducts(query) {
      const service = ProductService();
      const res = await service.searchProducts(query);
      this.products = res.data.products;
      this.total = res.data.total;
      this.skip = res.data.skip;
      this.limit = res.data.limit;
    }
  }
};
