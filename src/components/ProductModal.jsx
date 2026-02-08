import { useEffect, useState } from 'react';

// Utils
import { getErrorMessage, formatNumber } from '../utils';

// API
import { addProductApi, updateProductApi, deleteProductApi, uploadImageApi } from '../api/products';

// Modal 相關常數
const modalConfig = {
    preview: {
        title: '商品詳情',
        headerClass: 'bg-success',
    },
    add: {
        title: '新增商品',
        headerClass: 'bg-primary',
    },
    edit: {
        title: '編輯商品',
        headerClass: 'bg-primary',
    },
    delete: {
        title: '刪除商品',
        headerClass: 'bg-danger',
    },
};

const ProductModal = ({ getProducts, templateProduct, modalRef, modalType, closeModal }) => {
    const [templateData, setTemplateData] = useState(templateProduct);
    const [tempImageInput, setTempImageInput] = useState(''); // 暫存圖片輸入框的內容

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState('未選擇檔案。');

    useEffect(() => {
        setTemplateData(templateProduct);
    }, [templateProduct]);

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

        setTemplateData((prevData) => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    // 新增圖片邏輯 (限制最多 4 張)
    const handleAddImage = () => {
        if (tempImageInput === '') return;

        const currentMain = templateData.imageUrl;
        const currentSubs = templateData.imagesUrl || [];

        // 計算目前總張數
        const totalImages = (currentMain ? 1 : 0) + currentSubs.length;

        if (totalImages >= 4) {
            alert('最多只能上傳 4 張圖片');
            return;
        }

        setTemplateData((prev) => {
            if (!prev.imageUrl) {
                return { ...prev, imageUrl: tempImageInput };
            }
            return { ...prev, imagesUrl: [...(prev.imagesUrl || []), tempImageInput] };
        });

        setTempImageInput('');
    };

    // 刪除圖片邏輯 (重要：處理遞補)
    const handleRemoveImage = (index) => {
        const currentSubs = [...(templateData.imagesUrl || [])];

        if (index === 0) {
            // 如果刪除的是第 0 張 (主圖)
            // 將副圖的第一張移上來當主圖，如果沒有副圖則清空
            const newMain = currentSubs.length > 0 ? currentSubs.shift() : '';
            setTemplateData((prev) => ({
                ...prev,
                imageUrl: newMain,
                imagesUrl: currentSubs,
            }));
        } else {
            // 如果刪除的是副圖 (index 1~3)
            // 對應到 imagesUrl 的 index 是 (index - 1)
            currentSubs.splice(index - 1, 1);
            setTemplateData((prev) => ({
                ...prev,
                imagesUrl: currentSubs,
            }));
        }
    };

    // 選擇檔案
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setSelectedFileName(file.name);
    };

    // 衍生狀態：將主圖與副圖合併成一個陣列方便渲染
    // index 0 一定是主圖，index 1~3 是副圖
    const allImages = templateData.imageUrl ? [templateData.imageUrl, ...(templateData.imagesUrl || [])] : [];

    const isPreview = modalType === 'preview';
    const isFormMode = modalType === 'add' || modalType === 'edit';

    // 新增/更新產品
    const updateProduct = async () => {
        // 送出的資料
        const productData = {
            data: {
                ...templateData,
                origin_price: Number(templateData.origin_price), // 轉換為數字
                price: Number(templateData.price), // 轉換為數字
                ticket_quantity: Number(templateData.ticket_quantity), // 轉換為數字
                is_enabled: templateData.is_enabled ? 1 : 0, // 轉換為數字
                imagesUrl: [...templateData.imagesUrl.filter((url) => url !== '')], // 過濾空白
            },
        };
        try {
            let res;
            if (modalType === 'add') {
                res = await addProductApi(productData);
                alert('已新增產品！');

                await getProducts();
                closeModal();
            } else {
                res = await updateProductApi(templateData.id, productData);
                alert(`${res.data.message}`);

                await getProducts();
                closeModal();
            }
        } catch (error) {
            if (modalType === 'add') {
                alert(`新增失敗：${getErrorMessage(error)}!`);
            } else {
                alert(`更新失敗：${getErrorMessage(error)}!`);
            }
        }
    };

    // 刪除產品
    const deleteProduct = async (id) => {
        try {
            const res = await deleteProductApi(id);
            alert(`${res.data.message}`);

            await getProducts();
            closeModal();
        } catch (error) {
            alert(`刪除失敗：${getErrorMessage(error)}!`);
        }
    };

    // 上傳圖片
    const uploadImage = async () => {
        if (!selectedFile) {
            alert('請先選擇檔案');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file-to-upload', selectedFile);

            const res = await uploadImageApi(formData);
            const uploadedImageUrl = res.data.imageUrl;

            setTemplateData((prev) => {
                if (!prev.imageUrl) {
                    return { ...prev, imageUrl: uploadedImageUrl };
                }
                return {
                    ...prev,
                    imagesUrl: [...(prev.imagesUrl || []), uploadedImageUrl],
                };
            });

            // 清空狀態
            setSelectedFile(null);
            setSelectedFileName('未選擇檔案。');
        } catch (error) {
            alert(`上傳失敗：${getErrorMessage(error)}!`);
        }
    };

    return (
        <div className="modal fade" tabIndex="-1" ref={modalRef}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className={`modal-header text-white ${modalConfig[modalType]?.headerClass}`}>
                        <h5 className="modal-title fw-bold">{modalConfig[modalType]?.title}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={closeModal} />
                    </div>
                    <div className="modal-body">
                        {isPreview ? (
                            <div className="card rounded p-2 overflow-hidden">
                                <div className="row g-0">
                                    <div className="col-xl-5">
                                        <div className="p-2 p-xl-0">
                                            {templateData.imageUrl && (
                                                <img
                                                    src={templateData.imageUrl}
                                                    className="img-thumbnail mb-2"
                                                    alt={templateData.title}
                                                />
                                            )}
                                            <div className="thumbnails">
                                                <div className="row g-0">
                                                    {templateData.imagesUrl &&
                                                        templateData.imagesUrl.map((url, index) => (
                                                            <div className="col-4" key={index}>
                                                                <img
                                                                    src={url}
                                                                    className="img-thumbnail"
                                                                    alt={`${templateData.title} ${index + 1}`}
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
                                                {templateData.category}
                                            </h4>
                                            <h2 className="card-title fs-1 fw-bold border-bottom pb-3">
                                                {templateData.title}
                                            </h2>
                                            <p className="card-text pt-3">{templateData.description}</p>
                                            <p className="card-text pb-5">{templateData.content}</p>
                                            <div className="d-flex justify-content-end mt-auto">
                                                <p className="card-text fs-3 fw-bold text-primary">
                                                    NT$ {formatNumber(templateData.price)}
                                                    <span className="text-secondary fs-5 mx-2">/</span>
                                                    <del className="text-secondary fs-4">
                                                        {formatNumber(templateData.origin_price)}
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
                                            value={templateData.title}
                                            onChange={handleModalInputChange}
                                        />
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
                                            value={templateData.content}
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
                                            value={templateData.description}
                                            onChange={handleModalInputChange}
                                        ></textarea>
                                    </div>
                                    <div className="row">
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
                                                value={templateData.category}
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
                                                value={templateData.unit}
                                                onChange={handleModalInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="row">
                                        <div className="col-6 mb-3">
                                            <label htmlFor="productOriginalPrice" className="form-label">
                                                原價
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                id="productOriginalPrice"
                                                min="0"
                                                placeholder="請輸入金額"
                                                name="origin_price"
                                                value={templateData.origin_price}
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
                                                value={templateData.price}
                                                onChange={handleModalInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="productQuantity" className="form-label">
                                            庫存
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="productQuantity"
                                            min="0"
                                            placeholder="請輸入庫存數量"
                                            name="ticket_quantity"
                                            value={templateData.ticket_quantity}
                                            onChange={handleModalInputChange}
                                        />
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
                                                checked={templateData.is_enabled}
                                                onChange={handleModalInputChange}
                                            ></input>
                                        </div>
                                    </div>
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
                                        <div className="input-group mb-2">
                                            <label className="input-group-text" htmlFor="imageInputFile">
                                                瀏覽...
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control d-none"
                                                id="imageInputFile"
                                                name="file-to-upload"
                                                accept=".jpg, .jpeg, .png"
                                                onChange={handleFileChange}
                                            />
                                            <div className="file-name-display form-control">
                                                {selectedFileName}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={uploadImage}
                                                disabled={allImages.length >= 4}
                                            >
                                                上傳圖片
                                            </button>
                                        </div>
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
                                            {Array.from({ length: 4 - allImages.length }).map((_, index) => {
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
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>
                                確定要刪除
                                <span className="text-danger mx-2">{templateData.title}</span>
                                嗎？
                            </p>
                        )}
                    </div>
                    {!isPreview && (
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
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
                                    onClick={() => deleteProduct(templateData.id)}
                                >
                                    刪除
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
