import { createAxiosInstance } from "./axios"


export const TodoService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @typedef {Object} Todo
     * @property {number} id
     * @property {string} todo
     * @property {boolean} completed
     * @property {number} userId
     */
    /**
     * @param {Object} [params]
     * @returns {Promise<{todos: Todo[], total: number, skip: number, limit: number}>}
     */
    const getTodos = (params) => http.get('/todos', { params });
    /**
     * @param {number|string} id
     * @returns {Promise<Todo>}
     */
    const getTodo = (id) => http.get(`/todos/${id}`);
    /**
     * @param {Partial<Todo>} data
     * @returns {Promise<Todo>}
     */
    const addTodo = (data) => http.post('/todos/add', data);
    /**
     * @param {number|string} id
     * @param {Partial<Todo>} data
     * @returns {Promise<Todo>}
     */
    const updateTodo = (id, data) => http.put(`/todos/${id}`, data);
    /**
     * @param {number|string} id
     * @returns {Promise<{isDeleted: boolean, id: number}>}
     */
    const deleteTodo = (id) => http.delete(`/todos/${id}`);
    /**
     * @param {number|string} userId
     * @param {Object} [params]
     * @returns {Promise<{todos: Todo[], total: number, skip: number, limit: number}>}
     */
    const getUserTodos = (userId, params) => http.get(`/users/${userId}/todos`, { params });

    return {
        getTodos,
        getTodo,
        addTodo,
        updateTodo,
        deleteTodo,
        getUserTodos,
    };
}