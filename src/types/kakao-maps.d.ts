declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  interface MapOptions {
    center: LatLng;
    level: number;
    draggable?: boolean;
    disableDoubleClick?: boolean;
    disableDoubleClickZoom?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getLevel(): number;
    setLevel(level: number): void;
    setCenter(position: LatLng): void;
    panTo(position: LatLng): void;
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
    relayout(): void;
  }

  class MarkerImage {
    constructor(src: string, size: Size);
  }

  interface MarkerOptions {
    map?: Map | null;
    title?: string;
    position: LatLng;
    image?: MarkerImage;
    zIndex?: number;
    clickable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  interface MarkerClustererOptions {
    map: Map;
    averageCenter?: boolean;
    minLevel?: number;
    gridSize?: number;
    minClusterSize?: number;
    disableClickZoom?: boolean;
    styles?: Array<Record<string, string>>;
    calculator?: number[] | ((size: number) => number);
    texts?: string[] | ((size: number) => string);
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions);
    addMarkers(markers: Marker[]): void;
    clear(): void;
    setMap(map: Map | null): void;
  }

  namespace event {
    function addListener(target: Marker, type: string, handler: () => void): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao?: {
    maps: typeof kakao.maps;
  };
}
