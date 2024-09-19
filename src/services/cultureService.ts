import { RawCulture, Culture } from '@/types/culture';

export function mapRawCultureToCulture(rawCulture: RawCulture): Omit<Culture, 'id'> {
  return {
    classification: rawCulture.CODENAME ?? null,
    date: rawCulture.DATE ?? null,
    endDate: new Date(rawCulture.END_DATE) ?? null,
    etcDescription: rawCulture.ETC_DESC ?? null,
    guName: rawCulture.GUNAME ?? null,
    homepageDetailAddress: rawCulture.ORG_LINK ?? null,
    isFree: rawCulture.IS_FREE ?? null,
    lat: parseFloat(rawCulture.LOT) ?? null,
    lng: parseFloat(rawCulture.LAT) ?? null,
    mainImage: rawCulture.MAIN_IMG ?? null,
    homepageAddress: rawCulture.HMPG_ADDR ?? null,
    organizationName: rawCulture.ORG_NAME ?? null,
    place: rawCulture.PLACE ?? null,
    performerInformation: rawCulture.PLAYER ?? null,
    programIntroduction: rawCulture.PROGRAM ?? null,
    registrationDate: rawCulture.RGSTDATE ?? null,
    startDate: new Date(rawCulture.STRTDATE) ?? null,
    themeClassification: rawCulture.THEMECODE ?? null,
    register: rawCulture.TICKET ?? null,
    title: rawCulture.TITLE ?? null,
    useFee: rawCulture.USE_FEE ?? null,
    useTarget: rawCulture.USE_TRGT ?? null,
  };
}
