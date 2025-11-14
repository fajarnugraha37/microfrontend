import { createAxiosInstance } from "./axios"


export const DummyJsonService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Comment
     * @property {number} id
     * @property {string} body
     * @property {number} postId
     * @property {User} user
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{comments: Comment[], total: number, skip: number, limit: number}>}
     */
    const getComments = (params) => http.get('/comments', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Comment>}
     */
    const getComment = (id) => http.get(`/comments/${id}`);
    /**
     * @param {Partial<Comment>} data
     * @returns {Promise<Comment>}
     */
    const addComment = (data) => http.post('/comments/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<Comment>} data
     * @returns {Promise<Comment>}
     */
    const updateComment = (id, data) => http.put(`/comments/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deleteComment = (id) => http.delete(`/comments/${id}`);
    /**
     * @param {number|string} postId
     * @param {Object} [params]
     * @returns {Promise<{comments: Comment[], total: number, skip: number, limit: number}>}
     */
    const getPostComments = (postId, params) => http.get(`/posts/${postId}/comments`, { params });

    return {
        getComments,
        getComment,
        addComment,
        updateComment,
        deleteComment,
        getPostComments,
    };
}