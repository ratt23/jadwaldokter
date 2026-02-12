// Netlify Function to generate sitemap.xml dynamically
// Uses native fetch API (Node 18+)

exports.handler = async (event, context) => {
    try {
        // Use production domain
        const baseUrl = 'https://shab.web.id';
        const currentDate = new Date().toISOString();
        const apiBase = process.env.VITE_API_BASE_URL || 'https://dashdev2.netlify.app/.netlify/functions/api';

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

        // Static Pages
        const staticPages = [
            { loc: '/', priority: '1.0', changefreq: 'daily' },
            { loc: '/home', priority: '0.9', changefreq: 'daily' },
            { loc: '/article', priority: '0.9', changefreq: 'daily' },
            { loc: '/mcu', priority: '0.8', changefreq: 'weekly' },
            { loc: '/homecare', priority: '0.8', changefreq: 'weekly' }
        ];

        staticPages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
            xml += `    <lastmod>${currentDate}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });

        // 1. Fetch Articles
        try {
            // Note: dashdev2/api endpoints usually return { posts: [...] } or array
            // Adjust endpoint path if necessary. Based on local usage it's /posts
            // But apiConfig says base is .../api, so it's .../api/posts
            const response = await fetch(`${apiBase}/posts?status=published`);

            if (response.ok) {
                const data = await response.json();
                const articles = Array.isArray(data) ? data : (data.posts || []);

                articles.forEach(article => {
                    if (article.slug) {
                        const lastmod = article.updated_at || article.created_at || currentDate;
                        xml += '  <url>\n';
                        xml += `    <loc>${baseUrl}/article/${article.slug}</loc>\n`;
                        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
                        xml += '    <changefreq>weekly</changefreq>\n';
                        xml += '    <priority>0.8</priority>\n';

                        if (article.image_url || article.image) {
                            xml += '    <image:image>\n';
                            xml += `      <image:loc>${article.image_url || article.image}</image:loc>\n`;
                            xml += `      <image:title><![CDATA[${article.title || 'Article Image'}]]></image:title>\n`;
                            xml += '    </image:image>\n';
                        }
                        xml += '  </url>\n';
                    }
                });
            } else {
                console.error('Failed to fetch articles:', response.status);
            }
        } catch (apiError) {
            console.error('Error fetching articles for sitemap:', apiError);
        }

        // 2. Fetch Doctor Specialties
        // Route: /jadwal-dokter/siloam-ambon/:specialtyId
        try {
            const response = await fetch(`${apiBase}/doctors/grouped`);

            if (response.ok) {
                const doctorsData = await response.json();
                // doctorsData is an object: { "Specialty Key": { title: "...", doctors: [...] }, ... }

                Object.keys(doctorsData).forEach(specialtyKey => {
                    xml += '  <url>\n';
                    xml += `    <loc>${baseUrl}/jadwal-dokter/siloam-ambon/${specialtyKey}</loc>\n`;
                    xml += `    <lastmod>${currentDate}</lastmod>\n`;
                    xml += '    <changefreq>weekly</changefreq>\n';
                    xml += '    <priority>0.9</priority>\n';
                    xml += '  </url>\n';
                });
            } else {
                console.error('Failed to fetch doctor data:', response.status);
            }

        } catch (docError) {
            console.error('Error fetching doctor data for sitemap:', docError);
        }

        xml += '</urlset>';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
            body: xml
        };
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            body: '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>'
        };
    }
};
