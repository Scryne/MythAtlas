// MYTHATLAS_STATIC=1: GitHub Pages için statik dışa aktarım (out/). NEXT_PUBLIC_BASE_PATH proje sayfasının alt yolu
// (/MythAtlas), NEXT_PUBLIC_SITE_URL herkese açık adres. Yerel geliştirmede üçü de boş kalabilir.
const statik = process.env.MYTHATLAS_STATIC === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(statik ? { output: 'export', trailingSlash: true } : {}),
  ...(basePath ? { basePath } : {}),
  images: {
    // statik sitede görsel iyileştirme sunucusu yok; Commons küçük resimleri zaten boyutlu (src/data/image-map.json)
    unoptimized: statik,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      },
    ],
  },
};

export default nextConfig;
