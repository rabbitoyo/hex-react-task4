export const getToken = (name = 'hexToken') => {
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
    return cookie ? cookie.split('=')[1] : null;
};

export const setToken = (token, expired) => {
    document.cookie = `hexToken=${token}; expires=${new Date(expired)}; path=/;`;
};

export const removeToken = () => {
    document.cookie = 'hexToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
