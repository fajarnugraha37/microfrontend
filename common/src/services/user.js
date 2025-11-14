import { createAxiosInstance } from "./axios"


export const UserService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} User
     * @property {number} id
     * @property {string} firstName
     * @property {string} lastName
     * @property {string} email
     * @property {string} username
     * @property {string} password
     * @property {string} gender
     * @property {string} image
     * @property {string} token
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{users: User[], total: number, skip: number, limit: number}>}
     */
    const getUsers = (params) => http.get('/users', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<User>}
     */
    const getUser = (id) => http.get(`/users/${id}`);
    /**
     * @param {string} q
     * @param {Object} [params]
     * @returns {Promise<{users: User[], total: number, skip: number, limit: number}>}
     */
    const searchUsers = (q, params) => http.get('/users/search', { params: { q, ...params } });
    /**
     * @param {Partial<User>} data
     * @returns {Promise<User>}
     */
    const addUser = (data) => http.post('/users/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<User>} data
     * @returns {Promise<User>}
     */
    const updateUser = (id, data) => http.put(`/users/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deleteUser = (id) => http.delete(`/users/${id}`);
    /**
     * @param {{username: string, password: string}} data
     * @returns {Promise<{token: string, user: User}>}
     */
    const loginUser = (data) => http.post('/auth/login', data);

    return {
        getUsers,
        getUser,
        searchUsers,
        addUser,
        updateUser,
        deleteUser,
        loginUser,
    };
}