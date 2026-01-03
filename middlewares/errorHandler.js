const errorHandler = (err, req, res, next) => {
  // Optionnel : Console.error seulement si on n'est pas en test ou si c'est une 500
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  // --- Gestion erreurs Mongoose ---

  // 1. Doublons (unique: true)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `Le champ '${field}' existe déjà.` });
  }

  // 2. Validation (required, minlength, etc.)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ error: errors });
  }

  // 3. CastError (Mauvais format d'ID)
  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID invalide." });
  }

  // --- Gestion erreurs génériques (compatible avec votre ancien code) ---

  // Si l'erreur a un status défini (ex: créé par createError(404)), on l'utilise
  const status = err.status || 500;
  const message = err.message || "Erreur interne du serveur";

  return res.status(status).json({ error: message });
};
export default errorHandler;
