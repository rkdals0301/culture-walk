module.exports = {
  siteUrl: process.env.SITE_URL || 'https://culturewalk.vercel.app/', // 사이트의 기본 URL
  generateRobotsTxt: true, // robots.txt 파일 생성 여부
  changefreq: 'weekly', // 페이지 변경 빈도 (optional)
  priority: 0.7, // 페이지 우선 순위 (optional)
  sitemapSize: 5000, // 각 사이트맵 파일에 포함할 최대 URL 수 (optional)
};
