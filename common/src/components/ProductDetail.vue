<template>
  <div v-if="product" class="product-detail-card">
    <div class="product-detail-header">
      <h2 class="product-detail-title">{{ product.title }}</h2>
      <span class="product-detail-price">{{ formatPrice(product.price) }}</span>
    </div>
    <div v-if="product.images && product.images.length" class="product-detail-images">
      <img v-for="img in product.images" :src="img" :key="img" class="product-detail-image" :alt="product.title" />
    </div>
    <p class="product-detail-description">{{ product.description }}</p>
    <div class="product-detail-meta">
      <span><strong>Brand:</strong> {{ product.brand }}</span>
      <span><strong>Category:</strong> {{ product.category }}</span>
    </div>
  </div>
  <div v-else class="product-detail-loading">
    Loading...
  </div>
</template>

<script>
import productMixin from '../mixins/productMixin';
import formatPrice from '../utils/formatPrice';
export default {
  name: 'ProductDetail',
  mixins: [productMixin],
  props: ['id'],
  created() {
    if (this.id) {
      this.fetchProduct(this.id);
    }
  },
  watch: {
    id(newId, oldId) {
      if (newId && newId !== oldId) {
        this.fetchProduct(newId);
      }
    }
  },
  methods: {
    formatPrice
  }
};
</script>

<style scoped>
.product-detail-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 2rem;
  max-width: 480px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.product-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.product-detail-price {
  font-size: 1.25rem;
  color: #27ae60;
  font-weight: bold;
}
.product-detail-description {
  color: #444;
  font-size: 1rem;
}
.product-detail-images {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.product-detail-image {
  max-width: 120px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.product-detail-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.95rem;
  color: #666;
}
.product-detail-loading {
  text-align: center;
  color: #888;
  padding: 2rem;
}
</style>
