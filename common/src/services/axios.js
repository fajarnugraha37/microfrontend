import { Axios } from 'axios';


/**
 * 
 * @param {{
 * baseURL: string,
 * timeout: number,
 * }} config 
 * @returns {Axios}
 */
export const createAxiosInstance = (config) => {
    const _instance = new Axios({
        baseURL: config.baseURL || 'http://localhost:3000/api',
        timeout: config.timeout || 10000,
    });

    _instance.interceptors.request.use((config) => {
        // You can add authorization headers or other custom logic here
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // log request like nginx access log with format ---> HTTP %method %completeUrl %queryParameters
        console.log('---> HTTP ',
            config.method.toUpperCase(),
            ' ', config.url,
            ' ', JSON.stringify(config.params || {}));
        return config;
    });

    _instance.interceptors.response.use(
        (response) => {
            // log request like nginx access log with format <--- HTTP %status %method %completeUrl %queryParameters
            console.log('<--- HTTP',
                response.status,
                ' ', response.config.method.toUpperCase(),
                ' ', response.config.url,
                ' ', JSON.stringify(response.config.params || {}));
            return response;
        },
        (error) => {
            // log request like nginx error log with format <--- HTTP ERROR %status %method %completeUrl %queryParameters %detailErrors
            console.error('<--- HTTP ERROR ',
                error.response ? error.response.status : 'NETWORK_ERROR',
                ' ', error.config ? error.config.method.toUpperCase() : '',
                ' ', error.config ? error.config.url : '',
                ' ', JSON.stringify(error.config ? error.config.params || {} : {}), error.message);

            return Promise.reject(error);
        }
    );

    return _instance;
}