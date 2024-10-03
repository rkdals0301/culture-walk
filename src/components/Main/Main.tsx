interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return <main className='h-dvh w-full pt-20'>{children}</main>;
};

export default Main;
