'use client';
import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { businessLocation } from '@/lib/config';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: businessLocation.lat,
  lng: businessLocation.lng,
};

const mapLoaderId = 'el-vitral-google-maps';

function LocationMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: mapLoaderId,
    googleMapsApiKey: businessLocation.googleMapsApiKey,
  });

  if (loadError) {
    return (
      <MapMessage message="No fue posible cargar el mapa. Verifica la configuración de Google Maps." />
    );
  }

  if (!isLoaded) {
    return <MapMessage message="Cargando mapa..." />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}

function MapMessage({ message }: { message: string }) {
  return (
    <div className="flex h-96 w-full items-center justify-center bg-gray-200 px-6 text-center dark:bg-gray-700">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

const LocationSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Visítanos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Encuentra nuestra ubicación y contáctanos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de ubicación */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Información de Contacto
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">
                    location_on
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dirección</p>
                    <p className="text-gray-600 dark:text-gray-400">{businessLocation.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">
                    phone
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Teléfono</p>
                    <p className="text-gray-600 dark:text-gray-400">{businessLocation.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">
                    email
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-400">{businessLocation.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">
                    schedule
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Horarios</p>
                    <p className="text-gray-600 dark:text-gray-400">{businessLocation.hours}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa de Google Maps */}
          <div className="rounded-lg overflow-hidden shadow-md">
            {businessLocation.googleMapsApiKey ? (
              <LocationMap />
            ) : (
              <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Mapa no disponible.<br />
                  Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
