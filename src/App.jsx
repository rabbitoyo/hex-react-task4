import { useState, useRef, useEffect } from 'react';
import { Modal } from 'bootstrap';

// Components
import Loading from './components/Loading';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import ProductModal from './components/ProductModal';

// Utils
import { getToken, getErrorMessage } from './utils';

// API
import { checkAdminApi } from './api/auth';
import { getProductsApi } from './api/products';

// 產品初始資料
const initialProduct = {
    id: '',
    title: '',
    category: '',
    origin_price: 0,
    price: 0,
    unit: '',
    ticket_quantity: 0,
    description: '',
    content: '',
    is_enabled: 0,
    imageUrl: '',
    imagesUrl: [],
};

const App = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [templateProduct, setTemplateProduct] = useState(initialProduct);

    // Modal 相關的 ref
    const modalRef = useRef(null);
    const modalInstanceRef = useRef(null);

    const [modalType, setModalType] = useState('');

    // 取得產品
    const getProducts = async (page = 1) => {
        try {
            const res = await getProductsApi(page);
            setProducts(res.data.products);
            setPagination(res.data.pagination);
        } catch (error) {
            alert(`API 錯誤：${getErrorMessage(error)}!`);
        }
    };

    // 驗證登入
    useEffect(() => {
        // 檢查管理員權限
        const checkAdmin = async () => {
            try {
                setIsLoading(true);
                setIsCheckingAuth(true);

                const token = getToken();

                if (!token) {
                    setIsAuth(false);
                    return;
                }

                // 驗證 Token 是否有效
                await checkAdminApi();

                await getProducts();
                setIsAuth(true);
            } catch (error) {
                alert(`Token 驗證失敗：${getErrorMessage(error)}！`);
                setIsAuth(false);
            } finally {
                setIsLoading(false);
                setIsCheckingAuth(false);
            }
        };
        checkAdmin();
    }, []);

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

    // 彈窗開關狀態
    const openModal = (type, product = initialProduct) => {
        setModalType(type);
        setTemplateProduct({
            ...initialProduct,
            ...product,
        });
        modalInstanceRef.current.show();
    };
    const closeModal = () => {
        modalInstanceRef.current.hide();
    };

    return (
        <>
            <main>
                {/* Loading */}
                <Loading isLoading={isLoading} />

                {/* Login or Dashboard */}
                {!isCheckingAuth &&
                    (!isAuth ? (
                        <Login getProducts={getProducts} setIsLoading={setIsLoading} setIsAuth={setIsAuth} />
                    ) : (
                        <Dashboard
                            products={products}
                            setProducts={setProducts}
                            getProducts={getProducts}
                            pagination={pagination}
                            setIsLoading={setIsLoading}
                            setIsAuth={setIsAuth}
                            openModal={openModal}
                        />
                    ))}
            </main>

            {/* Modal */}
            <ProductModal
                modalRef={modalRef}
                getProducts={getProducts}
                templateProduct={templateProduct}
                modalType={modalType}
                closeModal={closeModal}
            />
        </>
    );
};

export default App;
