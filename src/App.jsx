import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Modal } from 'bootstrap';

// Components
import Login from './components/Login';
import Loading from './components/Loading';
import Dashboard from './components/Dashboard';

// Utils
import { getToken, setToken, removeToken, formatNumber, getErrorMessage } from './utils';

// API
const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE + '/',
});

const adminApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE}/api/${import.meta.env.VITE_API_PATH}/admin/`,
});

// 設定 interceptor，每次 request 都帶 token
adminApi.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

// 產品初始資料
const initialProduct = {
    id: '',
    title: '',
    category: '',
    origin_price: 0,
    price: 0,
    unit: '',
    description: '',
    content: '',
    is_enabled: 0,
    imageUrl: '',
    imagesUrl: [],
};

const App = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [products, setProducts] = useState([]);
    const [templateProduct, setTemplateProduct] = useState(initialProduct);
    const [tempImageInput, setTempImageInput] = useState(''); // 暫存圖片輸入框的內容
    const [modeType, setModeType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal 相關的 ref
    const modalRef = useRef(null);
    const modalInstanceRef = useRef(null);

    // 取得產品
    const getProducts = useCallback(async () => {
        try {
            const res = await adminApi.get('products');
            setProducts(res.data.products);
        } catch (error) {
            console.error('API 錯誤:', getErrorMessage(error));
        }
    }, []);

    // 更新產品狀態
    const updateProductStatus = async (id) => {
        try {
            const target = products.find((product) => product.id === id);
            const data = {
                data: {
                    ...target,
                    is_enabled: target.is_enabled === 1 ? 0 : 1,
                },
            };
            const res = await adminApi.put(`product/${id}`, data);
            alert(`${res.data.message}`);

            setProducts((prev) =>
                prev.map((item) => (item.id === id ? { ...item, is_enabled: data.data.is_enabled } : item))
            );
        } catch (error) {
            console.error('API 錯誤:', getErrorMessage(error));
        }
    };

    // 登入
    const handleLogin = async (account) => {
        try {
            setIsLoading(true);

            const res = await authApi.post('admin/signin', account);

            // token - 儲存 Token 到 Cookie
            const { token, expired } = res.data;
            setToken(token, expired);

            // 取得產品
            await getProducts();
            // 登入成功
            setIsAuth(true);
        } catch (error) {
            // console.error('API 錯誤:', getErrorMessage(error));
            alert(`${getErrorMessage(error)}!`);
            throw error; // 將錯誤拋出以便 Login 元件捕捉
        } finally {
            setIsLoading(false);
        }
    };

    // 登出
    const handleLogout = async () => {
        try {
            setIsLoading(true);

            const token = getToken();
            if (token) {
                await authApi.post('logout', null, {
                    headers: { Authorization: token },
                });
            }

            alert('已成功登出！');
        } catch (error) {
            console.error('API 錯誤:', getErrorMessage(error));
        } finally {
            // 清除 token
            removeToken();
            delete adminApi.defaults.headers.common['Authorization'];

            setIsAuth(false);
            setProducts([]);
            setIsLoading(false);
        }
    };

    // 檢查管理員權限
    const checkAdmin = useCallback(async () => {
        try {
            setIsLoading(true);
            setIsCheckingAuth(true);

            const token = getToken();

            if (!token) {
                setIsAuth(false);
                return;
            }

            // 驗證 Token 是否有效
            const res = await authApi.post('api/user/check', null, {
                headers: { Authorization: token },
            });
            // console.log('Token 驗證結果：', res.data.success);
            // alert(`已成功登入！Token 驗證結果：${res.data.success}`);

            if (res.data.success) {
                await getProducts(); // 等產品回來
                setIsAuth(true);
            } else {
                setIsAuth(false); // token 無效，自動登出
            }
        } catch (error) {
            // console.error('Token 驗證失敗：', getErrorMessage(error));
            alert(`請重新登入！Token 驗證失敗：${getErrorMessage(error)}`);
            setIsAuth(false);
        } finally {
            setIsLoading(false);
            setIsCheckingAuth(false);
        }
    }, [getProducts]);

    // 重新渲染就驗證登入
    useEffect(() => {
        checkAdmin();
    }, [checkAdmin]);

    // 建立 Modal 實例
    useEffect(() => {
        if (!modalRef.current) return;
        modalInstanceRef.current = new Modal(modalRef.current, {
            keyboard: false, // 禁止使用 ESC 關閉
        });

        modalRef.current.addEventListener('hide.bs.modal', () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        });

        // 清理函式
        return () => {
            if (modalInstanceRef.current) {
                modalInstanceRef.current.dispose();
            }
        };
    }, []);

    // 拿到 Modal 內的產品 input 的 value
    const handleModalInputChange = (e) => {
        const { name, value, checked, type } = e.target;

        let newValue = value;

        if (type === 'checkbox') {
            newValue = checked;
        } else if (type === 'number') {
            const numValue = Number(value);

            // 如果欄位被清空 (變成空字串) -> 保持空字串，讓使用者可以刪除
            // 如果輸入變成了負數 (例如輸入了 -1) -> 強制變成 0
            // 其他情況 (正整數) -> 保持使用者輸入的值
            if (value === '') {
                newValue = '';
            } else if (numValue < 0) {
                newValue = 0; // 👈 這裡就是你要的功能：輸入 -1 會瞬間變成 0
            } else {
                newValue = value;
            }
        }

        setTemplateProduct((prevData) => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    // 新增圖片邏輯 (限制最多 4 張)
    const handleAddImage = () => {
        if (tempImageInput === '') return;

        const currentMain = templateProduct.imageUrl;
        const currentSubs = templateProduct.imagesUrl || [];

        // 計算目前總張數
        const totalImages = (currentMain ? 1 : 0) + currentSubs.length;

        if (totalImages >= 4) {
            alert('最多只能上傳 4 張圖片');
            return;
        }

        setTemplateProduct((prev) => {
            if (!prev.imageUrl) {
                return { ...prev, imageUrl: tempImageInput };
            }
            return { ...prev, imagesUrl: [...(prev.imagesUrl || []), tempImageInput] };
        });

        setTempImageInput('');
    };

    // 刪除圖片邏輯 (重要：處理遞補)
    const handleRemoveImage = (index) => {
        const currentSubs = [...(templateProduct.imagesUrl || [])];

        if (index === 0) {
            // 如果刪除的是第 0 張 (主圖)
            // 將副圖的第一張移上來當主圖，如果沒有副圖則清空
            const newMain = currentSubs.length > 0 ? currentSubs.shift() : '';
            setTemplateProduct((prev) => ({
                ...prev,
                imageUrl: newMain,
                imagesUrl: currentSubs,
            }));
        } else {
            // 如果刪除的是副圖 (index 1~3)
            // 對應到 imagesUrl 的 index 是 (index - 1)
            currentSubs.splice(index - 1, 1);
            setTemplateProduct((prev) => ({
                ...prev,
                imagesUrl: currentSubs,
            }));
        }
    };

    // 衍生狀態：將主圖與副圖合併成一個陣列方便渲染
    // index 0 一定是主圖，index 1~3 是副圖
    const allImages = templateProduct.imageUrl
        ? [templateProduct.imageUrl, ...(templateProduct.imagesUrl || [])]
        : [];

    // 彈窗開關狀態
    const openModal = (type, product = initialProduct) => {
        setModeType(type);
        setTemplateProduct({
            ...initialProduct,
            ...product,
        });
        modalInstanceRef.current.show();
    };
    const closeModal = () => {
        modalInstanceRef.current.hide();
    };

    const isPreview = modeType === 'preview';
    const isFormMode = modeType === 'add' || modeType === 'edit';

    const updateProduct = async () => {
        // 送出的資料
        const productData = {
            data: {
                ...templateProduct,
                origin_price: Number(templateProduct.origin_price), // 轉換為數字
                price: Number(templateProduct.price), // 轉換為數字
                is_enabled: templateProduct.is_enabled ? 1 : 0, // 轉換為數字
                imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== '')], // 過濾空白
            },
        };
        try {
            let res;
            if (modeType === 'add') {
                res = await adminApi.post('product', productData);
                alert('已新增產品！');

                await getProducts();
                closeModal();
            } else {
                res = await adminApi.put(`product/${templateProduct.id}`, productData);
                alert(`${res.data.message}`);

                await getProducts();
                closeModal();
            }
        } catch (error) {
            // console.error('API 錯誤:', getErrorMessage(error));
            if (modeType === 'add') {
                alert(`新增失敗：${getErrorMessage(error)}!`);
            } else {
                alert(`更新失敗：${getErrorMessage(error)}!`);
            }
        }
    };

    const deleteProduct = async (id) => {
        try {
            const res = await adminApi.delete(`product/${id}`);
            alert(`${res.data.message}`);

            await getProducts();
            closeModal();
        } catch (error) {
            // console.error('API 錯誤:', getErrorMessage(error));
            alert(`刪除失敗：${getErrorMessage(error)}!`);
        }
    };

    return (
        <>
            {/* Loading */}
            <Loading isLoading={isLoading} />

            {/* Login or Dashboard */}
            {!isCheckingAuth &&
                (!isAuth ? (
                    <Login handleLogin={handleLogin} />
                ) : (
                    <Dashboard
                        products={products}
                        handleLogout={handleLogout}
                        openModal={openModal}
                        updateProductStatus={updateProductStatus}
                    />
                ))}

            {/* Modal */}
            <div className="modal fade" tabIndex="-1" ref={modalRef}>
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content">
                        <div
                            className={`modal-header text-white ${isPreview ? 'bg-success' : isFormMode ? 'bg-primary' : 'bg-danger'}`}
                        >
                            <h5 className="modal-title fw-bold">
                                {isPreview
                                    ? '商品詳情'
                                    : modeType === 'delete'
                                      ? '刪除商品'
                                      : modeType === 'add'
                                        ? '新增商品'
                                        : '編輯商品'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={closeModal}
                            />
                        </div>
                        <div className="modal-body">
                            {isPreview ? (
                                <div className="card rounded p-2 overflow-hidden">
                                    <div className="row g-0">
                                        <div className="col-xl-5">
                                            <div className="p-2 p-xl-0">
                                                <img
                                                    src={templateProduct.imageUrl}
                                                    className="img-thumbnail mb-2"
                                                    alt={templateProduct.title}
                                                />
                                                <div className="thumbnails">
                                                    <div className="row g-0">
                                                        {templateProduct.imagesUrl.map((url, index) => (
                                                            <div className="col-4" key={index}>
                                                                <img
                                                                    src={url}
                                                                    className="img-thumbnail"
                                                                    alt={`${templateProduct.title} ${index + 1}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-7">
                                            <div className="card-body p-4 px-3 pb-2 p-xl-4 h-100 d-flex flex-column">
                                                <h4 className="card-subtitle badge rounded-pill bg-primary fs-6 fw-normal mt-0 mb-1 align-self-start">
                                                    {templateProduct.category}
                                                </h4>
                                                <h2 className="card-title fs-1 fw-bold border-bottom pb-3">
                                                    {templateProduct.title}
                                                </h2>
                                                <p className="card-text pt-3">
                                                    {templateProduct.description}
                                                </p>
                                                <p className="card-text pb-5">{templateProduct.content}</p>
                                                <div className="d-flex justify-content-end mt-auto">
                                                    <p className="card-text fs-3 fw-bold text-primary">
                                                        NT$ {formatNumber(templateProduct.price)}
                                                        <span className="text-secondary fs-5 mx-2">/</span>
                                                        <del className="text-secondary fs-4">
                                                            {formatNumber(templateProduct.origin_price)}
                                                        </del>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : isFormMode ? (
                                <div className="row">
                                    <div className="col-md-6">
                                        <form action="">
                                            <div className="mb-3">
                                                <label htmlFor="productTitle" className="form-label">
                                                    商品名稱
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="productTitle"
                                                    placeholder="請輸入商品名稱"
                                                    name="title"
                                                    value={templateProduct.title}
                                                    onChange={handleModalInputChange}
                                                />
                                            </div>
                                            <div className="row">
                                                <div className="col-6 mb-3">
                                                    <label
                                                        htmlFor="productOriginalPrice"
                                                        className="form-label"
                                                    >
                                                        原價
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="productOriginalPrice"
                                                        min="0"
                                                        placeholder="請輸入金額"
                                                        name="origin_price"
                                                        value={templateProduct.origin_price}
                                                        onChange={handleModalInputChange}
                                                    />
                                                </div>
                                                <div className="col-6 mb-3">
                                                    <label htmlFor="productPrice" className="form-label">
                                                        售價
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="productPrice"
                                                        min="0"
                                                        placeholder="請輸入金額"
                                                        name="price"
                                                        value={templateProduct.price}
                                                        onChange={handleModalInputChange}
                                                    />
                                                </div>
                                                <div className="col-6 mb-3">
                                                    <label htmlFor="productCategory" className="form-label">
                                                        分類
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="productCategory"
                                                        placeholder="請輸入商品類別"
                                                        name="category"
                                                        value={templateProduct.category}
                                                        onChange={handleModalInputChange}
                                                    />
                                                </div>
                                                <div className="col-6 mb-3">
                                                    <label htmlFor="productUnit" className="form-label">
                                                        單位
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="productUnit"
                                                        placeholder="請輸入商品單位"
                                                        name="unit"
                                                        value={templateProduct.unit}
                                                        onChange={handleModalInputChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="productContent" className="form-label">
                                                    商品內容
                                                </label>
                                                <textarea
                                                    className="form-control no-resize"
                                                    id="productContent"
                                                    placeholder="請輸入商品內容"
                                                    rows="4"
                                                    name="content"
                                                    value={templateProduct.content}
                                                    onChange={handleModalInputChange}
                                                ></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="productDescription" className="form-label">
                                                    商品描述
                                                </label>
                                                <textarea
                                                    className="form-control no-resize"
                                                    id="productDescription"
                                                    placeholder="請輸入商品描述"
                                                    rows="4"
                                                    name="description"
                                                    value={templateProduct.description}
                                                    onChange={handleModalInputChange}
                                                ></textarea>
                                            </div>
                                            <div className="mb-3 d-flex align-items-center">
                                                <label htmlFor="is_enabled" className="form-label me-3 mb-0">
                                                    啟用
                                                </label>
                                                <div className="form-check form-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="is_enabled"
                                                        name="is_enabled"
                                                        checked={templateProduct.is_enabled}
                                                        onChange={handleModalInputChange}
                                                    ></input>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">上傳圖片 (最多 4 張)</label>
                                            <div className="input-group mb-2">
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    placeholder="請輸入圖片連結 (jpg, png...)"
                                                    value={tempImageInput}
                                                    onChange={(e) => setTempImageInput(e.target.value)}
                                                    // 達到 4 張時停用輸入框
                                                    disabled={allImages.length >= 4}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={handleAddImage}
                                                    disabled={allImages.length >= 4}
                                                >
                                                    新增連結
                                                </button>
                                            </div>
                                            {/* <div className="input-group mb-2">
                                                <label className="input-group-text" htmlFor="imageInputFile">
                                                    瀏覽...
                                                </label>
                                                <input
                                                    type="file"
                                                    className="form-control d-none"
                                                    id="imageInputFile"
                                                    accept=".jpg, .jpeg, .png"
                                                />
                                                <div className="file-name-display form-control">
                                                    未選擇檔案。
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    disabled=""
                                                >
                                                    上傳圖片
                                                </button>
                                            </div> */}
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="form-label mb-0">已上傳圖片</label>
                                            </div>
                                            <div id="imagesContainer" className="d-flex flex-wrap gap-2">
                                                {/* 渲染已存在的圖片 (包含主圖與副圖) */}
                                                {allImages.map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className={`image-preview-thumbnail-container ${index === 0 && 'main-image'}`}
                                                    >
                                                        <img
                                                            src={url}
                                                            className="image-preview-thumbnail"
                                                            alt={`Uploaded ${index}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm btn-delete-image"
                                                            onClick={() => handleRemoveImage(index)}
                                                        >
                                                            <span className="material-symbols-outlined fs-6">
                                                                close
                                                            </span>
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* 渲染剩餘的 Placeholder */}
                                                {/* 邏輯：減去 目前圖片數量，產生對應數量的空位 */}
                                                {Array.from({ length: 4 - allImages.length }).map(
                                                    (_, index) => {
                                                        // 計算這是第幾張 Image (目前的數量 + 迴圈的 index + 1)
                                                        const imgNum = allImages.length + index + 1;
                                                        return (
                                                            <div
                                                                key={`placeholder-${index}`}
                                                                className="image-preview-thumbnail-container"
                                                            >
                                                                <img
                                                                    src={`https://placehold.co/100x100/e9ecef/adb5bd?text=Image+${imgNum}`}
                                                                    className="image-preview-thumbnail"
                                                                    alt="placeholder"
                                                                />
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p>
                                    確定要刪除
                                    <span className="text-danger mx-2">{templateProduct.title}</span>
                                    嗎？
                                </p>
                            )}
                        </div>
                        {!isPreview && (
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={closeModal}
                                >
                                    取消
                                </button>
                                {isFormMode && (
                                    <button
                                        type="button"
                                        className="btn btn-primary text-white"
                                        onClick={updateProduct}
                                    >
                                        儲存
                                    </button>
                                )}
                                {!isPreview && !isFormMode && (
                                    <button
                                        type="button"
                                        className="btn btn-danger text-white"
                                        onClick={() => deleteProduct(templateProduct.id)}
                                    >
                                        刪除
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;
