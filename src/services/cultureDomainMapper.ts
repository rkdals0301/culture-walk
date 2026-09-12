import type { CultureRow } from '@/db/schema';
import type { Culture, CultureListItem, TourApiFestivalDetails } from '@/types/culture';
import { toDateOrNow } from '@/utils/dateUtils';

import { classifyTourApiFee, normalizeTourApiDetails } from './tourApiDetails';
import { normalizeCultureClassification, normalizeCultureCoordinates } from './cultureTourApiMapper';

export type CultureContentRow = Pick<
  CultureRow,
  | 'id'
  | 'sourceKey'
  | 'classification'
  | 'date'
  | 'endDate'
  | 'etcDescription'
  | 'guName'
  | 'homepageDetailAddress'
  | 'isFree'
  | 'lat'
  | 'lng'
  | 'mainImage'
  | 'homepageAddress'
  | 'organizationName'
  | 'place'
  | 'performerInformation'
  | 'programIntroduction'
  | 'registrationDate'
  | 'startDate'
  | 'themeClassification'
  | 'register'
  | 'title'
  | 'useFee'
  | 'useTarget'
  | 'createdAt'
  | 'updatedAt'
>;

export const mapCultureRowToCulture = (row: CultureContentRow, tourApiDetails?: TourApiFestivalDetails): Culture => {
  const startDate = toDateOrNow(row.startDate);
  const endDate = toDateOrNow(row.endDate ?? row.startDate);
  const coordinates = normalizeCultureCoordinates(row.lat, row.lng);
  const details = tourApiDetails ? normalizeTourApiDetails(tourApiDetails) : null;
  const address = row.place ?? '';
  const programIntroduction = details
    ? Array.from(new Set([details.program, details.subevent].filter(Boolean))).join('\n\n')
    : (row.programIntroduction ?? '');
  const mainImage = row.mainImage || details?.additionalImages[0]?.url || '/assets/images/logo.svg';
  const additionalImages = (details?.additionalImages ?? []).filter(image => image.url !== mainImage);
  const useFee = details?.useFee || row.useFee || '';

  return {
    id: row.id,
    classification: normalizeCultureClassification(row.classification),
    date: row.date ?? '',
    endDate,
    etcDescription: details?.contact || row.etcDescription || '',
    guName: row.guName ?? '',
    homepageDetailAddress: details?.bookingUrl || row.homepageDetailAddress || '',
    isFree: details?.useFee ? classifyTourApiFee(details.useFee) : (row.isFree ?? ''),
    lat: coordinates.lat,
    lng: coordinates.lng,
    mainImage,
    homepageAddress: details?.eventHomepage || row.homepageAddress || '',
    organizationName: details?.organizationName || row.organizationName || '',
    place: details?.eventPlace || row.place || '',
    address,
    performerInformation: details?.eventTime || row.performerInformation || '',
    programIntroduction,
    registrationDate: row.registrationDate ?? '',
    startDate,
    themeClassification: row.themeClassification ?? '',
    register: row.register ?? '',
    title: row.title ?? '',
    useFee,
    useTarget: details?.useTarget || row.useTarget || '',
    overview: details?.overview || '',
    eventTime: details?.eventTime || row.performerInformation || '',
    duration: details?.duration || '',
    bookingPlace: details?.bookingPlace || '',
    placeInformation: details?.placeInformation || '',
    contact: details?.contact || row.etcDescription || '',
    festivalGrade: details?.festivalGrade || '',
    discountInformation: details?.discountInformation || '',
    additionalInformation: details?.additionalInformation || [],
    additionalImages,
    createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
  };
};

export const mapCultureListItemToCulture = (item: CultureListItem): Culture => ({
  id: item.id,
  classification: item.classification,
  date: '',
  endDate: item.endDate,
  etcDescription: '',
  guName: item.guName,
  homepageDetailAddress: '',
  isFree: item.isFree,
  lat: item.lat,
  lng: item.lng,
  mainImage: item.mainImage,
  homepageAddress: '',
  organizationName: '',
  place: item.place,
  address: item.place,
  performerInformation: '',
  programIntroduction: '',
  registrationDate: '',
  startDate: item.startDate,
  themeClassification: '',
  register: '',
  title: item.title,
  useFee: item.useFee,
  useTarget: '',
  overview: '',
  eventTime: '',
  duration: '',
  bookingPlace: '',
  placeInformation: '',
  contact: '',
  festivalGrade: '',
  discountInformation: '',
  additionalInformation: [],
  additionalImages: [],
});
