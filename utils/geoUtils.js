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
