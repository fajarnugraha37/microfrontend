import { createAxiosInstance } from "./axios"


export const PostService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Post
     * @property {number} id
     * @property {string} title
     * @property {string} body
     * @property {number} userId
     * @property {number} reactions
     * @property {Array<{id: number, body: string, user: User}>} comments
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{posts: Post[], total: number, skip: number, limit: number}>}
     */
    const getPosts = (params) => http.get('/posts', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Post>}
     */
    const getPost = (id) => http.get(`/posts/${id}`);
    /**
     * @param {Partial<Post>} data
     * @returns {Promise<Post>}
     */
    const addPost = (data) => http.post('/posts/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<Post>} data
     * @returns {Promise<Post>}
     */
    const updatePost = (id, data) => http.put(`/posts/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deletePost = (id) => http.delete(`/posts/${id}`);
    /**
     * @param {number|string} userId
     * @param {Object} [params]
     * @returns {Promise<{posts: Post[], total: number, skip: number, limit: number}>}
     */
    const getUserPosts = (userId, params) => http.get(`/users/${userId}/posts`, { params });

    return {
        getPosts,
        getPost,
        addPost,
        updatePost,
        deletePost,
        getUserPosts,
    };
}