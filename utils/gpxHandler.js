// utils/gpxHandler.js
import { gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import createError from "http-errors";

const parseGpxToCoordinates = (fileBuffer) => {
  // 1. Parser le XML (GPX)
  const xml = new DOMParser().parseFromString(
    fileBuffer.toString(),
    "text/xml"
  );

  // 2. Convertir en GeoJSON (FeatureCollection)
  const geoJson = gpx(xml);

  // 3. Extraire la première Feature de type LineString
  const track = geoJson.features.find((f) => f.geometry.type === "LineString");

  if (!track || !track.geometry.coordinates.length) {
    throw createError(
      422,
      "Le fichier GPX ne contient aucun tracé (LineString) valide."
    );
  }

  // togeojson respecte déjà l'ordre [longitude, latitude], pas besoin d'inverser !
  return track.geometry.coordinates;
};

export { parseGpxToCoordinates };
