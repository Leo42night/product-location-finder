import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
  AdvancedMarker,
  useMap,
  Pin
} from "@vis.gl/react-google-maps";
import type { Marker } from '@googlemaps/markerclusterer';
import React, { useEffect, useState } from "react";

type Poi = {
  bar: string;
  lat: number;
  lng: number;
  name: string;
  price: number;
  prod_name: string;
};

const DEFAULT_CENTER = JSON.parse(import.meta.env.VITE_CENTER);

const PoiMarkers = React.memo((props: { pois: Poi[] })  => {
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers(prev => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  return (
    <>
      {props.pois.map((poi: Poi, index: number) => (
        <AdvancedMarker
          key={index}
          position={{ lat: poi.lat, lng: poi.lng }}
          ref={marker => setMarkerRef(marker, poi.bar)}
        >
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
        </AdvancedMarker>
      ))}
    </>
  );
});

const MapCircle: React.FC<{ radius: number }> = ({ radius }) => {
  const map = useMap(); // Access the map instance using useMap()

  useEffect(() => {
    let circle: google.maps.Circle | undefined;

    if (map) {
      // Create the circle on the map at the DEFAULT_CENTER
      circle = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        center: DEFAULT_CENTER,
        radius: radius, // Dynamic radius from props
      });
    }

    return () => {
      if (circle) {
        circle.setMap(null); // Remove the circle if component unmounts
      }
    };
  }, [map, radius]);  // Recreate the circle whenever the map or radius changes

  return (
    <div>
      <span>{radius} meters</span>
    </div>
  );
};

const MapComponent: React.FC = () => {
  const [productID, setProductID] = useState<string>('1234567890123');
  const [center, setCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [pois, setPois] = useState<Poi[]>([]);
  const [radius, setRadius] = useState<number>(8000); // State for dynamic radius


  // Remove the useCallback to prevent unnecessary re-creations
  const fetchData = async () => {
    const response = await fetch(import.meta.env.VITE_PHP_SERVER+`/php-api/search-barcode-loc.php?id=${productID}`);
    const data: Poi[] = await response.json();

    const filteredData = data.filter(poi => {
      const distance = calculateDistance(center, { lat: poi.lat, lng: poi.lng });
      return distance <= radius;
    });

    console.log(filteredData);
    setPois(filteredData);
  };

  // Use a debounced approach or rely on dependency conditions that won't cause loops
  useEffect(() => {
    fetchData(); // fetch data only when productID or radius changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productID, radius]);

  const handleMapCameraChanged = (event: MapCameraChangedEvent) => {
    const newCenter = event.detail.center;
    setCenter(newCenter);
  };

  return (
    <div className="container mx-5 w-screen">
      <div id="reader" style={{ width: "600px", height: "250px" }}></div>

      <div>
        <label>Product ID:</label>
        <input
          type="number"
          value={productID}
          onChange={(e) => setProductID(e.target.value)}
        />
      </div>

      <div>
        <label>Radius (meters):</label>
        <input
          style={{ width:'100%', height:'50px'  }}
          type="range"
          min="500"
          max="10000"
          step="10"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))} // Dynamically update radius
        />
        <span>{radius} meters</span>
      </div>

      <APIProvider apiKey={import.meta.env.VITE_GMAPS_API}>
        <Map
          mapId={import.meta.env.VITE_GMAPS_ID}
          center={center}
          zoom={13}
          onCameraChanged={handleMapCameraChanged}
          style={{ height: "400px", width: "100%" }}
        >
          {/* Use MapCircle component inside the Map */}
          <MapCircle radius={radius} />

          {/* Render the PoiMarkers component and pass the filtered POIs */}
          <PoiMarkers pois={pois} />
        </Map>
      </APIProvider>

    </div>
  )
}

const calculateDistance = (pointA: google.maps.LatLngLiteral, pointB: google.maps.LatLngLiteral): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = pointA.lat * Math.PI / 180;
  const φ2 = pointB.lat * Math.PI / 180;
  const Δφ = (pointB.lat - pointA.lat) * Math.PI / 180;
  const Δλ = (pointB.lng - pointA.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default MapComponent;