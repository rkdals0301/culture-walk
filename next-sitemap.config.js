const siteUrl = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/_not-found', '/404', '/api/*'],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
  transform: async (config, path) => {
    const priorityMap = {
      '/': 1.0,
      '/map': 1.0,
    };

    return {
      loc: path,
      changefreq: path === '/map' || path === '/' ? 'daily' : 'weekly',
      priority: priorityMap[path] ?? config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
  },
};
