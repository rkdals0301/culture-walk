export interface RawCulture {
  CODENAME: string;
  DATE: string;
  END_DATE: string;
  ETC_DESC: string;
  GUNAME: string;
  HMPG_ADDR: string;
  IS_FREE: string;
  LAT: string; // string 형태로 들어올 수 있음
  LOT: string; // string 형태로 들어올 수 있음
  MAIN_IMG: string;
  ORG_LINK: string;
  ORG_NAME: string;
  PLACE: string;
  PLAYER: string;
  PROGRAM: string;
  RGSTDATE: string;
  STRTDATE: string;
  THEMECODE: string;
  TICKET: string;
  TITLE: string;
  USE_FEE: string;
  USE_TRGT: string;
}

export interface Culture {
  id: number; // 고유 ID
  classification: string; // 분류
  date: string; // 날짜/시간
  endDate: Date; // 종료일
  etcDescription: string; // 기타내용
  guName: string; // 자치구
  homepageDetailAddress: string; // 문화포털상세URL
  isFree: string; // 유무료
  lat: number; // 위도
  lng: number; // 경도
  mainImage: string; // 대표이미지
  homepageAddress: string; // 홈페이지 주소
  organizationName: string; // 기관명
  place: string; // 장소
  performerInformation: string; // 출연자 정보
  programIntroduction: string; // 프로그램 소개
  registrationDate: string; // 신청일
  startDate: Date; // 시작일
  themeClassification: string; // 테마 분류
  register: string; // 시민/기관
  title: string; // 공연/행사명
  useFee: string; // 이용 요금
  useTarget: string; // 이용 대상
  createdAt?: Date; // 생성일
  updatedAt?: Date; // 수정일
}

export interface FormattedCulture extends Culture {
  displayDate: string;
  displayPlace: string;
  displayPrice: string;
}
