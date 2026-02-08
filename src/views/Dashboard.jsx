// Components
import SideBar from '../components/SideBar';
import Pagination from '../components/Pagination';

// Utils
import { removeToken, getErrorMessage, formatNumber } from '../utils';

// API
import { logoutApi } from '../api/auth';
import { updateProductApi } from '../api/products';

// Dashboard 元件
const Dashboard = ({
    products,
    setProducts,
    getProducts,
    pagination,
    setIsLoading,
    setIsAuth,
    openModal,
}) => {
    // 登出
    const handleLogout = async () => {
        try {
            setIsLoading(true);

            await logoutApi();

            alert('已成功登出！');
        } catch (error) {
            alert(`API 錯誤：${getErrorMessage(error)}!`);
        } finally {
            // 清除 token
            removeToken();

            setIsAuth(false);
            setProducts([]);
            setIsLoading(false);
        }
    };

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
            const res = await updateProductApi(id, data);
            alert(`${res.data.message}`);

            setProducts((prev) =>
                prev.map((item) => (item.id === id ? { ...item, is_enabled: data.data.is_enabled } : item))
            );
        } catch (error) {
            alert(`API 錯誤：${getErrorMessage(error)}!`);
        }
    };

    return (
        <section className="dashboard d-flex">
            <SideBar />
            <div className="content d-flex flex-column flex-grow-1 p-4">
                <nav className="navbar navbar-expand-lg bg-white shadow-sm rounded-2 mb-4">
                    <div className="container-fluid">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">後台</li>
                            <li className="breadcrumb-item active">旅程管理</li>
                        </ol>
                        <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
                            登出
                        </button>
                    </div>
                </nav>
                <div className="d-flex justify-content-end mb-4">
                    <button
                        type="button"
                        className="btn btn-primary text-white d-flex align-items-center"
                        onClick={() => {
                            openModal('add');
                        }}
                    >
                        <span className="material-symbols-outlined fs-5">add</span>
                        新增商品
                    </button>
                </div>
                <div className="bg-white shadow-sm rounded-2 p-4">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle text-center">
                            <thead>
                                <tr>
                                    <th scope="col">景觀</th>
                                    <th scope="col">分類</th>
                                    <th scope="col">商品名稱</th>
                                    <th scope="col">原價</th>
                                    <th scope="col">售價</th>
                                    <th scope="col">庫存</th>
                                    <th scope="col" className="text-center">
                                        啟用
                                    </th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    return (
                                        <tr key={product.id}>
                                            <td>
                                                <img
                                                    className="img-thumbnail"
                                                    src={product.imageUrl}
                                                    alt={product.title}
                                                />
                                            </td>
                                            <td>{product.category}</td>
                                            <td>{product.title}</td>
                                            <td>{formatNumber(product.origin_price)}</td>
                                            <td>{formatNumber(product.price)}</td>
                                            <td>{formatNumber(product.ticket_quantity)}</td>
                                            <td className="text-center">
                                                <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={product.is_enabled === 1}
                                                        onChange={() => updateProductStatus(product.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-nowrap">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success rounded-lg me-2"
                                                    onClick={() => {
                                                        openModal('preview', product);
                                                    }}
                                                >
                                                    預覽
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary rounded-lg me-2"
                                                    onClick={() => {
                                                        openModal('edit', product);
                                                    }}
                                                >
                                                    編輯
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger rounded-lg"
                                                    onClick={() => {
                                                        openModal('delete', product);
                                                    }}
                                                >
                                                    刪除
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <Pagination pagination={pagination} onChangePage={getProducts} />
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
