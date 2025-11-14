import { createAxiosInstance } from "./axios"


export const ProductService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Product
     * @property {number} id
     * @property {string} title
     * @property {string} description
     * @property {number} price
     * @property {string} brand
     * @property {string} category
     * @property {string[]} images
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{products: Product[], total: number, skip: number, limit: number}>}
     */
    const getProducts = (params) => http.get('/products', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Product>}
     */
    const getProduct = (id) => http.get(`/products/${id}`);
    /**
     * @param {string} q
     * @param {Object} [params]
     * @returns {Promise<{products: Product[], total: number, skip: number, limit: number}>}
     */
    const searchProducts = (q, params) => http.get('/products/search', { params: { q, ...params } });
    /**
     * @param {Partial<Product>} data
     * @returns {Promise<Product>}
     */
    const addProduct = (data) => http.post('/products/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<Product>} data
     * @returns {Promise<Product>}
     */
    const updateProduct = (id, data) => http.put(`/products/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deleteProduct = (id) => http.delete(`/products/${id}`);

    return {
        getProducts,
        getProduct,
        searchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
    };
}