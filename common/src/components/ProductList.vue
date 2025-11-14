<template>
  <div class="product-list-container">
    <h2 class="product-list-title">Product List</h2>
    <div v-if="config" class="product-list-config">
      <strong>API Base URL:</strong> {{ config.apiBaseUrl }}
    </div>
    <div v-if="products && products.length" class="product-list-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-card-image-wrapper">
          <img v-if="product.images && product.images.length" :src="product.images[0]" class="product-card-image" :alt="product.title" />
        </div>
        <div class="product-card-content">
          <h3 class="product-card-title">{{ product.title }}</h3>
          <p class="product-card-description">{{ product.description }}</p>
          <div class="product-card-meta">
            <span class="product-card-price">${{ product.price }}</span>
            <span class="product-card-brand">{{ product.brand }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="product-list-empty">No products found.</div>
  </div>
</template>
<script>
export default {
  name: 'ProductList',
  mixins: [],
  created() {
    this.fetchProducts();
  }
};
</script>

<style scoped>
.product-list-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
}
.product-list-title {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #222;
  text-align: center;
}
.product-list-config {
  margin-bottom: 1rem;
  color: #888;
  text-align: center;
}
.product-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}
.product-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.13);
}
.product-card-image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.product-card-image {
  max-width: 120px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.product-card-content {
  width: 100%;
  text-align: center;
}
.product-card-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}
.product-card-description {
  font-size: 0.98rem;
  color: #555;
  margin-bottom: 0.75rem;
}
.product-card-meta {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  font-size: 1rem;
  color: #666;
}
.product-card-price {
  color: #27ae60;
  font-weight: bold;
}
.product-card-brand {
  color: #888;
}
.product-list-empty {
  text-align: center;
  color: #aaa;
  padding: 2rem;
}
</style>
