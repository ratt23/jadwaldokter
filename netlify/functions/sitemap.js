// Netlify Function to generate sitemap.xml dynamically
// Uses native fetch API (Node 18+)

exports.handler = async (event, context) => {
    try {
        // Use production domain
        const baseUrl = 'https://shab.web.id';
        const currentDate = new Date().toISOString();

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

        // Homepage
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Home page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/home</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.9</priority>\n';
        xml += '  </url>\n';

        // Article list page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/article</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.9</priority>\n';
        xml += '  </url>\n';

        // MCU page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/mcu</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';

        // Home Care page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/homecare</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';

        // Fetch articles
        try {
            const apiBase = process.env.VITE_API_BASE_URL || 'https://dashdev1.netlify.app/.netlify/functions';
            const response = await fetch(`${apiBase}/api/posts?status=published`);

            if (response.ok) {
                const data = await response.json();
                const articles = Array.isArray(data) ? data : (data.posts || []);

                // Individual articles
                articles.forEach(article => {
                    if (article.slug) {
                        const lastmod = article.updated_at || article.created_at || currentDate;
                        xml += '  <url>\n';
                        xml += `    <loc>${baseUrl}/article/${article.slug}</loc>\n`;
                        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
                        xml += '    <changefreq>weekly</changefreq>\n';
                        xml += '    <priority>0.8</priority>\n';

                        // Add image if available
                        if (article.image_url || article.image) {
                            xml += '    <image:image>\n';
                            xml += `      <image:loc>${article.image_url || article.image}</image:loc>\n`;
                            xml += `      <image:title><![CDATA[${article.title}]]></image:title>\n`;
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
            // Continue generating sitemap without articles
        }

        xml += '</urlset>';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
            body: xml
        };
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8'
            },
            body: '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>'
        };
    }
};
