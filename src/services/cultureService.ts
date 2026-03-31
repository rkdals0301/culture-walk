import { CultureRow, NewCultureRow } from '@/db/schema';
import { Culture, RawCulture } from '@/types/culture';

const parseDateToIso = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const parseNumber = (value?: string) => {
  if (!value) return null;

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const toText = (value?: string) => value?.trim() || null;

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

export function mapRawCultureToCulture(rawCulture: RawCulture): NewCultureRow {
  return {
    classification: toText(rawCulture.CODENAME),
    date: toText(rawCulture.DATE),
    endDate: parseDateToIso(rawCulture.END_DATE),
    etcDescription: toText(rawCulture.ETC_DESC),
    guName: toText(rawCulture.GUNAME),
    homepageDetailAddress: toText(rawCulture.ORG_LINK),
    isFree: toText(rawCulture.IS_FREE),
    lat: parseNumber(rawCulture.LAT),
    lng: parseNumber(rawCulture.LOT),
    mainImage: toText(rawCulture.MAIN_IMG),
    homepageAddress: toText(rawCulture.HMPG_ADDR),
    organizationName: toText(rawCulture.ORG_NAME),
    place: toText(rawCulture.PLACE),
    performerInformation: toText(rawCulture.PLAYER),
    programIntroduction: toText(rawCulture.PROGRAM),
    registrationDate: toText(rawCulture.RGSTDATE),
    startDate: parseDateToIso(rawCulture.STRTDATE),
    themeClassification: toText(rawCulture.THEMECODE),
    register: toText(rawCulture.TICKET),
    title: toText(rawCulture.TITLE),
    useFee: toText(rawCulture.USE_FEE),
    useTarget: toText(rawCulture.USE_TRGT),
  };
}

export function mapCultureRowToCulture(row: CultureRow): Culture {
  const startDate = toDateOrNow(row.startDate);
  const endDate = toDateOrNow(row.endDate ?? row.startDate);

  return {
    id: row.id,
    classification: row.classification ?? '',
    date: row.date ?? '',
    endDate,
    etcDescription: row.etcDescription ?? '',
    guName: row.guName ?? '',
    homepageDetailAddress: row.homepageDetailAddress ?? '',
    isFree: row.isFree ?? '',
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
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
