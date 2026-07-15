import { CultureRow, NewCultureRow } from '@/db/schema';
import { Culture, TourApiFestival } from '@/types/culture';

import { createTourApiSourceKey } from './cultureIdentity';

const parseTourApiDateToIso = (value?: string) => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const parseTourApiTimestampToIso = (value?: string) => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const parseNumber = (value?: string) => {
  if (!value) return null;

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const toText = (value?: string) => value?.trim() || null;

const normalizeImageUrl = (value?: string) => {
  const url = toText(value);
  return url?.startsWith('http://tong.visitkorea.or.kr/') ? url.replace('http://', 'https://') : url;
};

const formatTourApiDate = (value?: string) => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value?.trim() || '';
};

const REGION_NAME_ALIASES: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라남도: '전남',
  전남광주통합특별시: '광주·전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

const resolveRegionName = (address?: string) => {
  const parts = address?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return null;

  const region = REGION_NAME_ALIASES[parts[0]] ?? parts[0];
  const locality = /[시군구]$/.test(parts[1] ?? '') ? parts[1] : null;
  return [region, locality].filter(Boolean).join(' ');
};

const resolveClassification = (festival: TourApiFestival) => {
  const value = `${festival.title} ${festival.festivaltype ?? ''}`;
  if (/(전시|미술|박람회|비엔날레)/.test(value)) return '전시';
  if (/(공연|콘서트|연극|뮤지컬|오페라|무용|국악|음악회)/.test(value)) return '공연';
  if (/(교육|체험|워크숍|클래스)/.test(value)) return '교육·체험';
  return festival.festivaltype?.trim() || '축제';
};

const toSafeExternalUrl = (value?: string) => {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
};

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const isBetween = (value: number, min: number, max: number) => value >= min && value <= max;
const looksLikeKoreaLat = (value: number) => isBetween(value, 33, 39.8);
const looksLikeKoreaLng = (value: number) => isBetween(value, 124, 132);

export const normalizeCultureCoordinates = (lat: number | null | undefined, lng: number | null | undefined) => {
  const safeLat = typeof lat === 'number' && Number.isFinite(lat) ? lat : 0;
  const safeLng = typeof lng === 'number' && Number.isFinite(lng) ? lng : 0;

  if (looksLikeKoreaLng(safeLat) && looksLikeKoreaLat(safeLng)) {
    return { lat: safeLng, lng: safeLat };
  }

  return { lat: safeLat, lng: safeLng };
};

export function mapTourApiFestivalToCulture(festival: TourApiFestival): NewCultureRow {
  const intro = festival.intro;
  const useFee = toText(intro?.usetimefestival);
  const address = [festival.addr1, festival.addr2].map(value => value?.trim()).filter(Boolean).join(' ');
  const place = toText(intro?.eventplace) ?? toText(address);
  const contact = toText(intro?.sponsor1tel) ?? toText(festival.tel);

  return {
    sourceKey: createTourApiSourceKey(festival.contentid),
    classification: resolveClassification(festival),
    date: `${formatTourApiDate(festival.eventstartdate)} ~ ${formatTourApiDate(festival.eventenddate)}`,
    endDate: parseTourApiDateToIso(festival.eventenddate),
    etcDescription: contact ? `문의 ${contact}` : null,
    guName: resolveRegionName(festival.addr1),
    homepageDetailAddress: toSafeExternalUrl(intro?.bookingplace),
    isFree: useFee?.includes('무료') ? '무료' : useFee ? '유료 또는 부분 유료' : '정보 없음',
    lat: parseNumber(festival.mapy),
    lng: parseNumber(festival.mapx),
    mainImage: normalizeImageUrl(festival.firstimage || festival.firstimage2),
    homepageAddress: toSafeExternalUrl(intro?.eventhomepage),
    organizationName: toText(intro?.sponsor1) ?? toText(intro?.sponsor2),
    place,
    performerInformation: toText(intro?.playtime),
    programIntroduction: toText(intro?.program) ?? toText(intro?.subevent),
    registrationDate: parseTourApiTimestampToIso(festival.modifiedtime || festival.createdtime),
    startDate: parseTourApiDateToIso(festival.eventstartdate),
    themeClassification: toText(festival.festivaltype),
    register: toText(festival.progresstype),
    title: toText(festival.title),
    useFee: useFee ?? '요금 정보 확인 필요',
    useTarget: toText(intro?.agelimit) ?? '누구나',
  };
}

export function mapCultureRowToCulture(row: CultureRow): Culture {
  const startDate = toDateOrNow(row.startDate);
  const endDate = toDateOrNow(row.endDate ?? row.startDate);
  const coordinates = normalizeCultureCoordinates(row.lat, row.lng);

  return {
    id: row.id,
    classification: row.classification ?? '',
    date: row.date ?? '',
    endDate,
    etcDescription: row.etcDescription ?? '',
    guName: row.guName ?? '',
    homepageDetailAddress: row.homepageDetailAddress ?? '',
    isFree: row.isFree ?? '',
    lat: coordinates.lat,
    lng: coordinates.lng,
    mainImage: row.mainImage ?? '/assets/images/logo.svg',
    homepageAddress: row.homepageAddress ?? '',
    organizationName: row.organizationName ?? '',
    place: row.place ?? '',
    performerInformation: row.performerInformation ?? '',
    programIntroduction: row.programIntroduction ?? '',
    registrationDate: row.registrationDate ?? '',
    startDate,
    themeClassification: row.themeClassification ?? '',
    register: row.register ?? '',
    title: row.title ?? '',
    useFee: row.useFee ?? '',
    useTarget: row.useTarget ?? '',
    createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
  };
}
