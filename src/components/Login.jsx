import { useState } from 'react';

// Login 元件
const Login = ({ handleLogin }) => {
    const [account, setAccount] = useState({ username: '', password: '' });

    // 拿到用戶 input 的 value
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAccount((prevData) => ({ ...prevData, [name]: value }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        handleLogin(account); // 把填好的資料傳回給 App
    };

    return (
        <div className="login position-fixed w-100 h-100 d-flex justify-content-center align-items-center">
            <div className="container">
                <div className="login-box blur-layer rounded-4 overflow-hidden shadow mx-auto text-primary">
                    <div className="login-header text-center px-5 py-4 text-white">
                        <h1 className="fw-semibold mb-2 d-flex justify-content-center align-items-center">
                            <span className="material-symbols-outlined bg-white text-primary rounded-2 p-2 me-2">
                                travel
                            </span>
                            Happy Travel
                        </h1>
                        <p>開始您的旅程管理</p>
                    </div>
                    <div className="login-body p-5">
                        <form className="pb-3" onSubmit={onSubmit}>
                            {/* input 綁定這裡內部的 handleInputChange */}
                            <div className="position-relative mb-3">
                                <label htmlFor="username" className="form-label">
                                    電子信箱
                                </label>
                                <input
                                    type="email"
                                    className="form-control border border-primary"
                                    name="username"
                                    value={account.username}
                                    onChange={handleInputChange}
                                    id="username"
                                    placeholder="請輸入 Email"
                                    autoFocus
                                    required
                                />
                                <span className="material-symbols-outlined">mail</span>
                            </div>
                            <div className="position-relative mb-3">
                                <label htmlFor="password" className="form-label">
                                    密碼
                                </label>
                                <input
                                    type="password"
                                    className="form-control border border-primary"
                                    name="password"
                                    value={account.password}
                                    onChange={handleInputChange}
                                    id="password"
                                    placeholder="請輸入密碼"
                                    required
                                />
                                <span className="material-symbols-outlined">lock_person</span>
                            </div>
                            <div className="mb-3 form-check">
                                <input
                                    type="checkBox"
                                    className="form-check-input border border-primary"
                                    id="checkBox"
                                />
                                <label className="form-check-label" htmlFor="checkBox">
                                    記住我
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 text-white fs-5 py-3">
                                登入
                            </button>
                        </form>
                        {/* <hr />
                        <p className='text-center mt-3'>還沒有帳號？ 立即註冊</p> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
