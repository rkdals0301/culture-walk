interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return <main className='h-dvh w-full pt-14'>{children}</main>;
};

export default Main;
