// SideBar 元件
const SideBar = () => {
    return (
        <div className="sidebar bg-primary d-flex flex-column p-4">
            <h4 className="fw-semibold mb-2 d-flex justify-content-center align-items-center text-white mb-5">
                <span className="material-symbols-outlined bg-white text-primary rounded-2 p-1 me-2">
                    travel
                </span>
                Happy Travel
            </h4>
            <nav className="nav nav-pills flex-column">
                <li className="nav-item">
                    <a href="#" className="nav-link active d-flex align-items-center">
                        <span className="material-symbols-outlined p-1 me-1">airplane_ticket</span>
                        旅程管理
                    </a>
                </li>
            </nav>
        </div>
    );
};

export default SideBar;
