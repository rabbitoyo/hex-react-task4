// 價格千分位處理
export const formatNumber = (num) => {
    // 安全性檢查：如果 num 是 undefined 或 null，回傳 0 或空字串
    if (num === undefined || num === null) return '0';

    let parts = num.toString().split('.'); // 分割整數和小數部分
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 格式化整數部分
    return parts.length > 1 ? parts.join('.') : parts[0]; // 拼接小數部分
};
