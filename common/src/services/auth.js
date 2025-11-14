import { createAxiosInstance } from "./axios"


export const AuthService = () => {
    const http = createAxiosInstance({
        baseURL: 'https://dummyjson.com',
        timeout: 5000,
    });

    /**
     * @param {{username: string, password: string}} data
     * @returns {Promise<{token: string, user: User}>}
     */
    const login = (data) => http.post('/auth/login', data);
    /**
     * @param {{refreshToken: string}} data
     * @returns {Promise<{token: string}>}
     */
    const refreshToken = (data) => http.post('/auth/refresh', data);

    // Return all methods
    return {
        login,
        refreshToken,
    };
}