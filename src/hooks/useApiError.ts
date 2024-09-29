import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface ErrorResponse {
  message: string;
}

type StatusHandler = (msg?: string) => void;

// 기본 에러 메시지들
const DEFAULT_ERROR_MESSAGE = '서버에서 알 수 없는 오류가 발생했습니다.';
const SERVER_CONNECTION_ERROR = '서버 연결이 원활하지 않습니다.';
const NETWORK_ERROR_MESSAGE = '네트워크 연결 오류 또는 기타 오류가 발생했습니다.';

const useApiError = () => {
  // 상태 핸들러 정의
  const handle400Error: StatusHandler = msg => toast.error(msg);
  const handle401Error: StatusHandler = () => toast.error('로그인 세션이 만료가 되었습니다. 다시 로그인 해주세요.');
  const handle403Error: StatusHandler = () => toast.error('해당 기능에 대한 권한이 없습니다.');
  const handle500Error: StatusHandler = () => toast.error('서버 오류가 발생했습니다.');

  // 상태 핸들러와 기본 핸들러를 포함하는 객체 생성
  const statusHandlers = useMemo<Record<number, StatusHandler> & { default: StatusHandler }>(
    () => ({
      400: handle400Error,
      401: handle401Error,
      403: handle403Error,
      500: handle500Error,
      default: msg => toast.error(msg || DEFAULT_ERROR_MESSAGE),
    }),
    []
  );

  const handleError = useCallback(
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const httpStatus = error.response.status;
          const errorResponse = error.response.data as ErrorResponse;
          const httpMessage = errorResponse.message;

          // httpStatus에 따라 적절한 핸들러 호출
          const handler = statusHandlers[httpStatus] || statusHandlers.default;
          handler(httpMessage);
        } else {
          toast.error(SERVER_CONNECTION_ERROR);
        }
      } else {
        toast.error(NETWORK_ERROR_MESSAGE);
      }
    },
    [statusHandlers]
  );

  return { handleError };
};

export default useApiError;
