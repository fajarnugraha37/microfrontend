import { createAxiosInstance } from "./axios"


export const QuoteService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Quote
     * @property {number} id
     * @property {string} quote
     * @property {string} author
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{quotes: Quote[], total: number, skip: number, limit: number}>}
     */
    const getQuotes = (params) => http.get('/quotes', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Quote>}
     */
    const getQuote = (id) => http.get(`/quotes/${id}`);

    return {
        getQuotes,
        getQuote,
    };
}