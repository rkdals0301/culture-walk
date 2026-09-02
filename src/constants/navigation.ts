export interface NavigationLink {
  href: string;
  label: string;
}

export const NAVIGATION_LINKS: NavigationLink[] = [
  { href: '/map', label: '문화지도' },
  { href: '/about', label: '서비스 소개' },
  { href: '/contact', label: '문의하기' },
];
