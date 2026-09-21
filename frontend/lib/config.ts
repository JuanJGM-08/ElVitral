// Configuración de la ubicación del negocio
export const businessLocation = {
  address: 'Calle 30 # 73-26, Medellín, Antioquia, Colombia',
  phone: '+57 313 792 84 83',
  email: 'elvitralsena@gmail.com',
  hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
  // Coordenadas para Google Maps
  lat: 6.231625393769719,
  lng: -75.59377863971152,
  // API Key de Google Maps (configurar en .env.local)
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

// Imagen por defecto para reseñas sin avatar
export const defaultAvatar = 'https://static.vecteezy.com/system/resources/previews/002/387/693/non_2x/user-profile-icon-free-vector.jpg';