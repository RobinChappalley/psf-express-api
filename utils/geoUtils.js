export const isLatitude = (value) => value >= -90 && value <= 90;
export const isLongitude = (value) => value >= -180 && value <= 180;

export const validateLineString = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  return coords.every(
    (point) =>
      Array.isArray(point) &&
      point.length >= 2 &&
      isLongitude(point[0]) &&
      isLatitude(point[1])
  );
};

// Calcule la distance en km entre 2 points GPS (formule de Haversine)
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calcule la distance minimale entre un point et un tracé GPS (LineString)
// coordinates: [[lng, lat], [lng, lat], ...] - format GeoJSON
export const getMinDistanceToLineString = (userLat, userLon, coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  for (const point of coordinates) {
    const [lon, lat] = point; // ATTENTION: ordre GeoJSON = [lng, lat]
    const distance = haversineDistance(userLat, userLon, lat, lon);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
};

// Génère une bounding box pour le pré-filtrage MongoDB
// Retourne les coordonnées min/max pour créer un rectangle autour du point
export const getBoundingBox = (lat, lon, radiusKm) => {
  const latDelta = radiusKm / 111; // ~111km par degré de latitude
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
};
