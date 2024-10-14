import Button from '@/components/Common/Button';

import Link from 'next/link';

const NotFound = () => {
  return (
    <section className='flex size-full flex-col items-center justify-center gap-4'>
      <h2 className='text-3xl font-bold md:text-2xl'>페이지를 찾을 수 없습니다.</h2>
      <nav>
        <Link href='/' replace>
          <Button ariaLabel='홈으로'>홈으로</Button>
        </Link>
      </nav>
    </section>
  );
};

export default NotFound;
