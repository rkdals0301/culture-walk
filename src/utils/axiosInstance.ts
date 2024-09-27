import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL을 빈 문자열로 설정하여 상대 경로를 사용할 수 있도록 함
  baseURL: '', // 상대 경로 사용
  timeout: 10000, // 요청 시간 제한 (10초)
  headers: {
    'Content-Type': 'application/json', // 기본 헤더
  },
});

export default axiosInstance;
