/**
 * background.js
 * Service Worker de l'extension Kanban Tasks (Manifest V3).
 * Gère l'authentification OAuth2, le proxy API pour le content script,
 * et l'ouverture en plein écran sur clic de l'icône d'extension.
 */

// Ouvrir le Kanban dans un nouvel onglet au clic sur l'icône
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
});

/**
 * Récupère le jeton d'authentification OAuth2.
 * @param {boolean} interactive - Affiche l'invite de connexion si nécessaire.
 * @returns {Promise<string>} Le jeton d'accès pour l'API Google Tasks.
 */
async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, function (token) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error("Aucun jeton d'authentification n'a été retourné."));
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Supprime le jeton d'authentification du cache (utile pour la déconnexion).
 * @param {string} token - Le jeton à révoquer.
 * @returns {Promise<void>}
 */
async function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

// Écouteur de messages globaux
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Récupération du jeton OAuth2
  if (message.type === "GET_TASKS_TOKEN") {
    getAuthToken(message.interactive !== false)
      .then((token) => sendResponse({ success: true, token }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Réponse asynchrone
  }

  // Déconnexion / révocation du jeton
  if (message.type === "LOGOUT_USER" && message.token) {
    removeCachedToken(message.token)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Proxy API générique pour le content script
  // Le content script ne peut pas faire de requêtes cross-origin vers tasks.googleapis.com
  if (message.type === "API_PROXY") {
    (async () => {
      try {
        const { endpoint, method, body, token } = message;
        const url = `https://tasks.googleapis.com/tasks/v1${endpoint}`;
        const options = {
          method: method || "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        };
        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (response.status === 204) {
          sendResponse({ success: true, data: null, status: response.status });
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          sendResponse({
            success: false,
            error: errorData.error?.message || `HTTP ${response.status}`,
            status: response.status
          });
          return;
        }

        const data = await response.json();
        sendResponse({ success: true, data, status: response.status });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Relai dynamique lors d'un ajout depuis Gmail (bouton dans la barre d'outils)
  if (message.type === "EMAIL_CAPTURED") {
    (async () => {
      try {
        await chrome.storage.local.set({ lastCapturedEmail: message.data });
        // Relaye le message à l'interface (si déjà ouverte dans un autre contexte)
        chrome.runtime.sendMessage(message).catch(() => {});
        sendResponse({ success: true });
      } catch (err) {
        console.error("Erreur lors de la capture depuis Gmail :", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});