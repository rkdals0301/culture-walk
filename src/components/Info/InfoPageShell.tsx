import type { ReactNode } from 'react';

interface InfoPageShellProps {
  children: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

const InfoPageShell = ({ children, title, description, action }: InfoPageShellProps) => {
  return (
    <div className='info-page-scroll-shell info-page-shell h-full overflow-y-auto overflow-x-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-10'>
      <div className='info-page-container mx-auto grid w-full max-w-6xl'>
        <header className='info-page-intro'>
          <div className={action ? 'info-page-intro-grid' : 'info-page-intro-grid info-page-intro-grid-single'}>
            <div className='info-page-intro-copy'>
              <h1 className='info-page-title'>{title}</h1>
              <p className='info-page-description'>{description}</p>
            </div>
            {action && <div className='info-page-action-slot'>{action}</div>}
          </div>
        </header>
        <div className='info-page-content'>{children}</div>
      </div>
    </div>
  );
};

export default InfoPageShell;
