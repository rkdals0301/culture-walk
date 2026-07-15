export interface TourApiFestivalIntro {
  agelimit?: string;
  bookingplace?: string;
  discountinfofestival?: string;
  eventhomepage?: string;
  eventplace?: string;
  festivalgrade?: string;
  placeinfo?: string;
  playtime?: string;
  program?: string;
  spendtimefestival?: string;
  sponsor1?: string;
  sponsor1tel?: string;
  sponsor2?: string;
  sponsor2tel?: string;
  subevent?: string;
  usetimefestival?: string;
}

export interface TourApiFestivalCommon {
  contentid?: string;
  contenttypeid?: string;
  firstimage?: string;
  firstimage2?: string;
  homepage?: string;
  overview?: string;
  tel?: string;
  telname?: string;
}

export interface TourApiFestivalInfo {
  contentid?: string;
  contenttypeid?: string;
  fldgubun?: string;
  infoname?: string;
  infotext?: string;
  serialnum?: string;
}

export interface TourApiFestivalImage {
  contentid?: string;
  cpyrhtDivCd?: string;
  imgname?: string;
  originimgurl?: string;
  serialnum?: string;
  smallimageurl?: string;
}

export interface TourApiFestivalDetails {
  common?: TourApiFestivalCommon;
  intro?: TourApiFestivalIntro;
  info: TourApiFestivalInfo[];
  images: TourApiFestivalImage[];
  complete: boolean;
}

export interface TourApiFestival {
  addr1?: string;
  addr2?: string;
  areacode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  contentid: string;
  contenttypeid?: string;
  createdtime?: string;
  eventenddate: string;
  eventstartdate: string;
  festivaltype?: string;
  firstimage?: string;
  firstimage2?: string;
  lclsSystm1?: string;
  lclsSystm2?: string;
  lclsSystm3?: string;
  lDongRegnCd?: string;
  lDongSignguCd?: string;
  mapx?: string;
  mapy?: string;
  modifiedtime?: string;
  progresstype?: string;
  sigungucode?: string;
  tel?: string;
  title: string;
  zipcode?: string;
}

export interface CultureAdditionalInformation {
  name: string;
  text: string;
}

export interface CultureDetailImage {
  name: string;
  thumbnailUrl: string;
  url: string;
}

export interface Culture {
  id: number; // 고유 ID
  classification: string; // 분류
  date: string; // 날짜/시간
  endDate: Date; // 종료일
  etcDescription: string; // 기타내용
  guName: string; // 시도·시군구
  homepageDetailAddress: string; // 행사 상세 URL
  isFree: string; // 유무료
  lat: number; // 위도
  lng: number; // 경도
  mainImage: string; // 대표이미지
  homepageAddress: string; // 홈페이지 주소
  organizationName: string; // 기관명
  place: string; // 장소
  performerInformation: string; // 운영·공연 시간(기존 DB 필드명)
  programIntroduction: string; // 프로그램 소개
  registrationDate: string; // 신청일
  startDate: Date; // 시작일
  themeClassification: string; // 테마 분류
  register: string; // 시민/기관
  title: string; // 공연/행사명
  useFee: string; // 이용 요금
  useTarget: string; // 이용 대상
  overview: string; // 행사 소개
  eventTime: string; // 운영·공연 시간
  duration: string; // 관람 소요시간
  bookingPlace: string; // 예매처 안내
  placeInformation: string; // 행사장 안내
  contact: string; // 문의처
  festivalGrade: string; // 축제 등급
  discountInformation: string; // 할인 정보
  additionalInformation: CultureAdditionalInformation[]; // 반복 상세정보
  additionalImages: CultureDetailImage[]; // 추가 이미지
  createdAt?: Date; // 생성일
  updatedAt?: Date; // 수정일
}

export type CultureListItem = Pick<
  Culture,
  | 'id'
  | 'classification'
  | 'endDate'
  | 'guName'
  | 'isFree'
  | 'lat'
  | 'lng'
  | 'mainImage'
  | 'place'
  | 'startDate'
  | 'title'
  | 'useFee'
>;

export type FormattedCulture = CultureListItem &
  Partial<Culture> & {
  displayDate: string;
  displayPlace: string;
  displayPrice: string;
};
