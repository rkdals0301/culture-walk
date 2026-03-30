interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return <main className='relative h-dvh w-full overflow-hidden'>{children}</main>;
};

export default Main;
