import { createAxiosInstance } from "./axios"


export const CartService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Cart
     * @property {number} id
     * @property {number} userId
     * @property {Array<{id: number, title: string, price: number, quantity: number}>} products
     * @property {number} total
     * @property {number} discountedTotal
     * @property {number} totalProducts
     * @property {number} totalQuantity
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{carts: Cart[], total: number, skip: number, limit: number}>}
     */
    const getCarts = (params) => http.get('/carts', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Cart>}
     */
    const getCart = (id) => http.get(`/carts/${id}`);
    /**
     * @param {Partial<Cart>} data
     * @returns {Promise<Cart>}
     */
    const addCart = (data) => http.post('/carts/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<Cart>} data
     * @returns {Promise<Cart>}
     */
    const updateCart = (id, data) => http.put(`/carts/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deleteCart = (id) => http.delete(`/carts/${id}`);

    return {
        getCarts,
        getCart,
        addCart,
        updateCart,
        deleteCart,
    };
}