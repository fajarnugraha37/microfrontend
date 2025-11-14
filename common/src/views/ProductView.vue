<template>
  <div>
    <h2>Product Search</h2>
    <ProductSearch @select-product="onSelectProduct" />
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal">&times;</button>
        <ProductDetail v-if="selectedId" :id="selectedId" />
      </div>
    </div>
  </div>
</template>
<script>
import ProductDetail from '../components/ProductDetail.vue';
import ProductSearch from '../components/ProductSearch.vue';

export default {
  name: 'ProductView',
  mixins: [],
  components: {
    ProductDetail,
    ProductSearch,
  },
  data() {
    return {
      selectedId: null,
      showModal: false,
    };
  },
  methods: {
    onSelectProduct(id) {
      this.selectedId = id;
      this.showModal = true;
      this.fetchProduct(id);
    },
    closeModal() {
      this.showModal = false;
      this.selectedId = null;
    },
  },

};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  max-width: 520px;
  width: 100%;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  z-index: 1;
}
</style>
