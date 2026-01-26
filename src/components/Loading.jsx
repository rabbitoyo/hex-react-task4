import { useEffect } from 'react';

// Loading 元件
const Loading = ({ isLoading }) => {
    // 監聽讀取狀態時，body不能滾動
    useEffect(() => {
        const body = document.querySelector('body');
        if (isLoading) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }
    }, [isLoading]);

    if (!isLoading) return null; // 沒有 loading 就不 render

    return (
        <div className="loading">
            <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default Loading;
