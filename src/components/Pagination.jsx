const Pagination = ({ pagination, onChangePage }) => {
    const handleClick = (e, page) => {
        e.preventDefault();
        onChangePage(page);
    };

    return (
        <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center mt-3">
                <li className={`page-item ${!pagination.has_pre ? 'disabled' : ''}`}>
                    <a
                        className="page-link"
                        href="#"
                        aria-label="Previous"
                        onClick={(e) => handleClick(e, pagination.current_page - 1)}
                    >
                        <span className="material-symbols-outlined fs-6" aria-hidden="true">
                            keyboard_arrow_left
                        </span>
                    </a>
                </li>
                {Array.from({ length: pagination.total_pages }).map((_, index) => (
                    <li
                        className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}
                        key={`page-${index + 1}`}
                    >
                        <a className="page-link" href="#" onClick={(e) => handleClick(e, index + 1)}>
                            {index + 1}
                        </a>
                    </li>
                ))}
                <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                    <a
                        className="page-link"
                        href="#"
                        aria-label="Next"
                        onClick={(e) => handleClick(e, pagination.current_page + 1)}
                    >
                        <span className="material-symbols-outlined fs-6" aria-hidden="true">
                            keyboard_arrow_right
                        </span>
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;
