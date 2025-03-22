import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup, Tooltip } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import "./styles.css";
import MarkerDialog from './components/MarkerDialog';
import { mapStorage } from './mapStorage';

// მარკერის იკონის კონფიგურაცია
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// კლასტერის იკონის შექმნის ფუნქცია
const createClusterCustomIcon = function(cluster) {
  return L.divIcon({
    html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true)
  });
};

// SearchBox კომპონენტი
const SearchBox = ({ setMarkerPosition }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'მოძებნეთ მისამართი',
      keepResult: false
    });

    map.addControl(searchControl);
    
    map.on('geosearch/showlocation', (e) => {
      const { x, y } = e.location;
      setMarkerPosition([y, x]);
    });

    return () => map.removeControl(searchControl);
  }, [map, setMarkerPosition]);

  return null;
};

const App = () => {
  const [markers, setMarkers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState(null);
  const [editingMarker, setEditingMarker] = useState(null);
  const defaultCenter = [41.7151, 44.8271]; // თბილისის კოორდინატები

  // მარკერების წამოღება storage-დან
  useEffect(() => {
    const loadMarkers = async () => {
      const savedMarkers = await mapStorage.getMarkers();
      setMarkers(savedMarkers);
    };
    loadMarkers();
  }, []);

  // მარკერების შენახვა storage-ში
  useEffect(() => {
    if (markers.length > 0) {
      mapStorage.saveMarkers(markers);
    }
  }, [markers]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setDialogPosition({ lat, lng });
    setEditingMarker(null);
    setIsDialogOpen(true);
  };

  const handleMarkerEdit = (marker) => {
    setEditingMarker(marker);
    setDialogPosition({ lat: marker.position[0], lng: marker.position[1] });
    setIsDialogOpen(true);
  };

  const handleMarkerDelete = async (markerId) => {
    if (window.confirm('ნამდვილად გსურთ მარკერის წაშლა?')) {
      const success = await mapStorage.deleteMarker(markerId);
      if (success) {
        setMarkers(markers.filter(m => m.id !== markerId));
      }
    }
  };

  // დავამატოთ ახალი ფუნქცია მისამართის მისაღებად
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "მისამართი ვერ მოიძებნა";
    }
  };

  const handleSaveMarker = async (markerData) => {
    const address = await getAddressFromCoordinates(markerData.position.lat, markerData.position.lng);
    
    if (editingMarker) {
      // მარკერის განახლება
      setMarkers(markers.map(m => 
        m.id === editingMarker.id 
          ? { 
              ...m, 
              title: markerData.title, 
              description: markerData.description,
              address: address
            }
          : m
      ));
    } else {
      // ახალი მარკერის დამატება
      const newMarker = {
        id: Date.now(),
        position: [markerData.position.lat, markerData.position.lng],
        title: markerData.title,
        description: markerData.description,
        address: address
      };
      setMarkers([...markers, newMarker]);
    }
    setIsDialogOpen(false);
    setEditingMarker(null);
  };

  return (
    <div className="map-container">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        className="leaflet-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SearchBox setMarkerPosition={(pos) => {
          setDialogPosition({ lat: pos[0], lng: pos[1] });
          setIsDialogOpen(true);
        }} />
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={80}
          spiderfyOnMaxZoom={false}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          spiderLegPolylineOptions={{ weight: 0, opacity: 0 }}
          iconCreateFunction={createClusterCustomIcon}
          polygonOptions={{
            fillColor: '#1978c8',
            color: '#1978c8',
            weight: 0,
            opacity: 0,
            fillOpacity: 0
          }}
          onMouseOver={(cluster) => {
            cluster.layer.spiderfy();
          }}
          onMouseOut={(cluster) => {
            cluster.layer.unspiderfy();
          }}
        >
          {markers.map(marker => (
            <Marker 
              key={marker.id} 
              position={marker.position}
              icon={customIcon}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -40]} 
                opacity={1}
                permanent={false}
              >
                <div className="marker-tooltip">
                  <strong>{marker.title}</strong>
                  <p className="address">{marker.address}</p>
                  <p>{marker.description}</p>
                </div>
              </Tooltip>
              <Popup>
                <div className="marker-popup">
                  <h3>{marker.title}</h3>
                  <p className="address">{marker.address}</p>
                  <p>{marker.description}</p>
                  <div className="marker-actions">
                    <button onClick={() => handleMarkerEdit(marker)}>
                      რედაქტირება
                    </button>
                    <button 
                      onClick={() => handleMarkerDelete(marker.id)}
                      className="delete-btn"
                    >
                      წაშლა
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        
        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>

      <MarkerDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingMarker(null);
        }}
        onSave={handleSaveMarker}
        position={dialogPosition}
        editingMarker={editingMarker}
      />
    </div>
  );
};

// ცალკე კომპონენტი რუკის ივენთების დასაჭერად
const MapEvents = ({ onMapClick }) => {
  const map = useMap();
  
  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default App;
[];
