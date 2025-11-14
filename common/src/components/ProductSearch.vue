<template>
  <div class="product-search-container">
    <input
      v-model="query"
      @input="onSearch"
      class="product-search-input"
      placeholder="Search products..."
      autocomplete="off"
    />
    <div v-if="loading" class="product-search-loading">Searching...</div>
    <div v-if="error" class="product-search-error">{{ error }}</div>
    <div v-if="products && products.length" class="product-search-results">
      <div v-for="product in products" :key="product.id" class="product-search-card">
        <div class="product-search-card-image-wrapper">
          <img v-if="product.images && product.images.length" :src="product.images[0]" class="product-search-card-image" :alt="product.title" />
        </div>
        <div class="product-search-card-content">
          <h3 class="product-search-card-title">{{ product.title }}</h3>
          <div class="product-search-card-meta">
            <span class="product-search-card-price">{{ formatPrice(product.price) }}</span>
            <span class="product-search-card-brand">{{ product.brand }}</span>
          </div>
          <button class="product-search-card-btn" @click="$emit('select-product', product.id)">View Details</button>
        </div>
      </div>
    </div>
    <div v-else-if="query && !loading && !error" class="product-search-empty">No products found.</div>
  </div>
</template>
<script>
import productMixin from '../mixins/productMixin';
import formatPrice from '../utils/formatPrice';
export default {
  name: 'ProductSearch',
  mixins: [productMixin],
  data() {
    return {
      query: '',
      loading: false,
      error: null
    };
  },
  created() {
    // Setup debounced search function
    this.debouncedSearch = this.debounce(this.onSearch, 400);
  },
  methods: {
    async onSearch() {
      if (!this.query) {
        this.products = [];
        this.error = null;
        return;
      }
      this.loading = true;
      this.error = null;
      try {
        await this.searchProducts(this.query);
      } catch (e) {
        this.error = 'Failed to search products.';
      }
      this.loading = false;
    },
    debounce(fn, delay) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },
    formatPrice
  },
  watch: {
    query() {
      this.debouncedSearch();
    }
  }
};
</script>

<style scoped>
.product-search-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}
.product-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
}
.product-search-loading {
  text-align: center;
  color: #888;
  margin-bottom: 1rem;
}
.product-search-error {
  text-align: center;
  color: #e74c3c;
  margin-bottom: 1rem;
}
.product-search-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}
.product-search-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}
.product-search-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.13);
}
.product-search-card-image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}
.product-search-card-image {
  max-width: 80px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.product-search-card-content {
  width: 100%;
  text-align: center;
}
.product-search-card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}
.product-search-card-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.98rem;
  color: #666;
  margin-bottom: 0.5rem;
}
.product-search-card-price {
  color: #27ae60;
  font-weight: bold;
}
.product-search-card-brand {
  color: #888;
}
.product-search-card-btn {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}
.product-search-card-btn:hover {
  background: #217dbb;
}
.product-search-empty {
  text-align: center;
  color: #aaa;
  padding: 1.5rem;
}
</style>
