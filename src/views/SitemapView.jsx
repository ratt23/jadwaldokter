import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SitemapRoute = () => {
    const location = useLocation();

    useEffect(() => {
        const generateSitemap = async () => {
            try {
                // Use production domain
                const baseUrl = 'https://shab.web.id';
                const currentDate = new Date().toISOString();

                // Keep this consistent with sitemap.js
                // In client-side, we might want to use the config, but let's hardcode to dashdev2 for consistency with the server function
                // or use the environment variable if available.
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://dashdev2.netlify.app/.netlify/functions/api';

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
                                    xml += `      <image:title>${article.title}</image:title>\n`;
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
                try {
                    const response = await fetch(`${apiBase}/doctors/grouped`);
                    if (response.ok) {
                        const doctorsData = await response.json();
                        Object.keys(doctorsData).forEach(specialtyKey => {
                            xml += '  <url>\n';
                            xml += `    <loc>${baseUrl}/jadwal-dokter/siloam-ambon/${specialtyKey}</loc>\n`;
                            xml += `    <lastmod>${currentDate}</lastmod>\n`;
                            xml += '    <changefreq>weekly</changefreq>\n';
                            xml += '    <priority>0.9</priority>\n';
                            xml += '  </url>\n';
                        });
                    }
                } catch (docError) {
                    console.error('Error fetching doctor data for sitemap:', docError);
                }

                xml += '</urlset>';

                // Set proper headers and return XML
                const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                // Download the sitemap
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sitemap.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Also display the XML
                document.body.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
            } catch (error) {
                console.error('Error generating sitemap:', error);
                document.body.innerHTML = `<div style="padding: 20px; font-family: Arial;"><h1>Error Generating Sitemap</h1><p>${error.message}</p></div>`;
            }
        };

        if (location.pathname === '/sitemap.xml') {
            generateSitemap();
        }
    }, [location]);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <h1>Generating Sitemap...</h1>
            <p>Please wait while we generate the sitemap for you. If it does not download automatically, please check your popup blocker.</p>
        </div>
    );
};

export default SitemapRoute;
