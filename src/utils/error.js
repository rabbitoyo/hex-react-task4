// 顯示 API 錯誤
export const getErrorMessage = (error) => {
    // 處理常見錯誤類型
    if (error?.response?.status === 401) {
        return '登入失敗，請重新檢查帳號密碼';
    }
    if (error?.response?.status === 403) {
        return '無權限進行此操作';
    }
    return error?.response?.data?.message || error.message || '發生未知錯誤';
};
