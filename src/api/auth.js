import axios from 'axios';
import { getToken } from '../utils';

const BASE_URL = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const authApi = axios.create({
    baseURL: `${BASE_URL}/`,
});

const adminApi = axios.create({
    baseURL: `${BASE_URL}/api/${API_PATH}/admin/`,
});

// 設定 interceptor
const setAuthHeader = (config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
};

// 設定 interceptor
adminApi.interceptors.request.use(setAuthHeader);
authApi.interceptors.request.use(setAuthHeader);

// 登入 API
export const loginApi = (account) => authApi.post('admin/signin', account);

// 檢查權限 API
export const checkAdminApi = () => authApi.post('api/user/check');

// 登出 API
export const logoutApi = () => authApi.post('logout');

export { authApi, adminApi };
