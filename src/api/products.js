import { adminApi } from './auth';

// 取得產品
export const getProductsApi = (page) => adminApi.get(`products?page=${page}`);

// 新增產品
export const addProductApi = (data) => adminApi.post('product', data);

// 更新產品
export const updateProductApi = (id, data) => adminApi.put(`product/${id}`, data);

// 刪除產品
export const deleteProductApi = (id) => adminApi.delete(`product/${id}`);

// 上傳圖片
export const uploadImageApi = (formData) => adminApi.post('upload', formData);
