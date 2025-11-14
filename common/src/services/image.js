import { createAxiosInstance } from "./axios"


export const ImageService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @param {Object} [params]
     * @returns {Promise<{images: Image[], total: number, skip: number, limit: number}>}
     */
    const getImages = (params) => http.get('/images', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Image>}
     */
    const getImage = (id) => http.get(`/images/${id}`);

    return {
        getImages,
        getImage,
    };
}