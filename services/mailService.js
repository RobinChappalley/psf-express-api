import nodemailer from "nodemailer";

// Configuration du transporteur selon l'environnement
let transporter = null;

/**
 * Initialise le transporteur email
 * - test: pas de transporteur (mock)
 * - development: Mailpit (localhost:1025)
 * - production: SMTP Infomaniak
 */
export async function initMailTransporter() {
  const env = process.env.NODE_ENV || "development";

  if (env === "test") {
    // En test, on n'initialise pas de transporteur (sera mocké)
    transporter = null;
    return;
  }

  if (env === "development") {
    // Mailpit en développement local
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mailpit",
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      secure: false,
      // Pas d'auth pour Mailpit
    });
    console.log("📧 Mail transporter: Mailpit (development)");
    return;
  }

  // Production: SMTP Infomaniak
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.infomaniak.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Vérifier la connexion
  try {
    await transporter.verify();
    console.log("📧 Mail transporter: SMTP Infomaniak (production)");
  } catch (error) {
    console.error("❌ Erreur connexion SMTP:", error.message);
  }
}

/**
 * Envoie un email
 * @param {Object} options - Options de l'email
 * @param {string|string[]} options.to - Destinataire(s)
 * @param {string} options.subject - Sujet
 * @param {string} options.text - Contenu texte
 * @param {string} [options.html] - Contenu HTML (optionnel)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export async function sendMail({ to, subject, text, html }) {
  const env = process.env.NODE_ENV || "development";

  // En test, on simule l'envoi
  if (env === "test") {
    return {
      messageId: `test-${Date.now()}@mock`,
      accepted: Array.isArray(to) ? to : [to],
      rejected: [],
    };
  }

  if (!transporter) {
    throw new Error("Mail transporter not initialized. Call initMailTransporter() first.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const result = await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text,
    html,
  });

  return result;
}

/**
 * Envoie une notification de nouvel entraînement
 * @param {Object} params
 * @param {Object} params.training - L'entraînement créé
 * @param {Object} params.camp - Le camp associé
 * @param {Array} params.recipients - Liste des utilisateurs à notifier
 */
export async function sendTrainingNotification({ training, camp, recipients }) {
  if (!recipients || recipients.length === 0) {
    return { sent: 0, errors: [] };
  }

  const results = { sent: 0, errors: [] };

  for (const user of recipients) {
    if (!user.email) continue;

    const dateFormatted = training.date
      ? new Date(training.date).toLocaleDateString("fr-CH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Date à confirmer";

    const subject = `Nouvel entraînement - ${camp.title}`;
    const text = `Bonjour ${user.firstname || ""},

Un nouvel entraînement a été ajouté pour le camp "${camp.title}".

Date : ${dateFormatted}
Lieu de rendez-vous : ${training.meetingPoint || "À confirmer"}
Heure de rendez-vous : ${training.meetingTime || "À confirmer"}

Connectez-vous à l'application pour voir tous les détails.

Pieds Sans Frontières`;

    try {
      await sendMail({
        to: user.email,
        subject,
        text,
      });
      results.sent++;
    } catch (error) {
      results.errors.push({ email: user.email, error: error.message });
    }
  }

  return results;
}

export default {
  initMailTransporter,
  sendMail,
  sendTrainingNotification,
};
