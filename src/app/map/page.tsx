import dynamic from 'next/dynamic';
// import styles from './page.module.scss';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

const Map = () => <MapView />;

export default Map;
