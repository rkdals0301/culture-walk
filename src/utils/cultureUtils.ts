import { RawCulture, FormattedCulture } from '@/types/culture';

const formatString = (object: RawCulture, keys: (keyof RawCulture)[], separate = ', '): string => {
  const values = keys.map(key => object[key]);
  const result = values.filter(val => val !== undefined && val !== null).join(separate);
  return result;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (startDate: string, endDate: string) => {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  return formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} ~ ${formattedEndDate}`;
};

export const formatCultureData = (cultures: RawCulture[]): FormattedCulture[] => {
  // 현재 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 필터링을 위한 날짜 변환 함수
  const isWithinRange = (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate.split(' ')[0]);
    const end = new Date(endDate.split(' ')[0]);
    return today >= start && today <= end;
  };

  // 필터링된 문화 데이터
  const filteredCultures = cultures.filter(culture => isWithinRange(culture['STRTDATE'], culture['END_DATE']));

  // 데이터 매핑
  const mappedCultures = filteredCultures.map((culture: RawCulture, index: number) => {
    const {
      CODENAME,
      DATE,
      END_DATE,
      ETC_DESC,
      GUNAME,
      HMPG_ADDR,
      IS_FREE,
      LAT,
      LOT,
      MAIN_IMG,
      ORG_LINK,
      ORG_NAME,
      PLACE,
      PLAYER,
      PROGRAM,
      RGSTDATE,
      STRTDATE,
      THEMECODE,
      TICKET,
      TITLE,
      USE_FEE,
      USE_TRGT,
    } = culture;

    return {
      id: index,
      classification: CODENAME, // 분류
      date: DATE, // 날짜/시간
      endDate: END_DATE, // 종료일
      etcDescription: ETC_DESC, // 기타내용
      guName: GUNAME, // 자치구
      homepageDetailAddress: HMPG_ADDR, // 문화포털상세URL
      isFree: IS_FREE, // 유무료
      lat: LOT, // 위도(X좌표)
      lng: LAT, // 경도(Y좌표)
      mainImage: MAIN_IMG, // 대표이미지
      homepageAddress: ORG_LINK, // 홈페이지 주소
      organizationName: ORG_NAME, // 기관명
      place: PLACE, // 장소
      performerInformation: PLAYER, // 출연자정보
      programIntroduction: PROGRAM, // 프로그램소개
      registrationDate: RGSTDATE, // 신청일
      startDate: STRTDATE, // 시작일
      themeClassification: THEMECODE, // 테마분류
      register: TICKET, // 시민/기관
      title: TITLE, // 공연/행사명
      useFee: USE_FEE, // 이용요금
      useTarget: USE_TRGT, // 이용대상
      displayDate: formatDisplayDate(STRTDATE, END_DATE),
      displayPlace: formatString(culture, ['CODENAME', 'GUNAME', 'PLACE'], ' / '),
      displayPrice: IS_FREE === '유료' ? formatString(culture, ['IS_FREE', 'USE_FEE']) : IS_FREE,
    };
  });

  return mappedCultures;
};
