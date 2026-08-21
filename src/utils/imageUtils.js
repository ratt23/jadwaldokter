export const getProxiedImageUrl = (url) => {
    if (!url || url === '/asset/logo/logo.png') return '/asset/logo/logo.png';
    return url;
};

