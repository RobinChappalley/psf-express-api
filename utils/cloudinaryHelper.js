import { v2 as cloudinary } from "cloudinary";

// Configuration explicite nécessaire si elle n'est pas faite globalement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extrait le public_id d'une URL Cloudinary et supprime l'image.
 * Format URL attendu : https://res.cloudinary.com/.../upload/v1234/folder/image.jpg
 * Public ID extrait : folder/image
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  // Extraction de l'ID
  const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
  const match = imageUrl.match(regex);

  if (!match || !match[1]) {
    // Si l'URL est invalide, faut-il bloquer ?
    // Ici je décide que oui pour la consistance, mais on pourrait débattre.
    throw createError(400, "Invalid image URL format");
  }

  const publicId = match[1];

  // On attend la réponse. Si Cloudinary est down, ça throw une erreur ici.
  // Note : destroy() renvoie un résultat, on peut vérifier result === 'ok' si on veut être puriste
  const response = await cloudinary.uploader.destroy(publicId);

  if (response.result !== "ok" && response.result !== "not found") {
    // Si Cloudinary répond mais dit qu'il n'a pas pu supprimer (ex: ressource verrouillée)
    throw createError(502, "Cloudinary failed to delete image");
  }
};
