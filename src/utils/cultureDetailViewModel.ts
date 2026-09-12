import type { FormattedCultureDetail } from '@/types/culture';
import {
  formatCultureDetailText,
  getCulturePriceTone,
  getCultureTiming,
  getUniqueCultureAdditionalInformation,
  hasMeaningfulCultureValue,
  isCultureProgramRedundant,
  normalizeCultureContent,
  splitCultureContact,
} from '@/utils/cultureUtils';

export const getCultureDetailViewModel = (culture: FormattedCultureDetail) => {
  const imageList: string[] = [];
  if (culture.mainImage && !culture.mainImage.includes('/assets/images/logo')) imageList.push(culture.mainImage);
  for (const image of culture.additionalImages ?? []) {
    if (image.url && !imageList.includes(image.url)) imageList.push(image.url);
  }

  const priceTone = getCulturePriceTone(culture);
  const timing = getCultureTiming(culture);
  const venueName = hasMeaningfulCultureValue(culture.place)
    ? normalizeCultureContent(culture.place)
    : normalizeCultureContent(culture.guName);
  const address = hasMeaningfulCultureValue(culture.address) ? normalizeCultureContent(culture.address) : '';
  const fullAddress = address || venueName;

  return {
    imageList,
    priceTone,
    ...timing,
    venueName,
    address,
    fullAddress,
    hasSeparateAddress: Boolean(address) && address !== normalizeCultureContent(culture.place),
    displayFee: hasMeaningfulCultureValue(culture.useFee)
      ? formatCultureDetailText(culture.useFee)
      : hasMeaningfulCultureValue(culture.displayPrice)
        ? formatCultureDetailText(culture.displayPrice)
        : priceTone === 'free'
          ? '무료'
          : '요금 정보 확인',
    contactSegments: splitCultureContact(culture.contact),
    hasOverview: hasMeaningfulCultureValue(culture.overview),
    hasProgram:
      hasMeaningfulCultureValue(culture.programIntroduction) &&
      !isCultureProgramRedundant(culture.overview, culture.programIntroduction),
    visibleAdditionalInformation: getUniqueCultureAdditionalInformation(culture.additionalInformation, [
      culture.overview,
      culture.programIntroduction,
    ]),
  };
};

export type CultureDetailViewModel = ReturnType<typeof getCultureDetailViewModel>;
