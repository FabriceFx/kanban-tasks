/**
 * parser.js
 * Ce module gère la sérialisation et la désérialisation des données.
 * Il permet d'encapsuler les métadonnées Kanban (colonnes, tags, liens Gmail)
 * directement dans le champ textuel 'notes' (description) d'une tâche Google Tasks.
 */

// Délimiteur unique pour isoler la description utilisateur des métadonnées système
const METADATA_DELIMITER = "\n\n--- KANBAN_METADATA ---\n";

/**
 * @typedef {Object} Subtask
 * @property {string} id - L'identifiant unique de la sous-tâche.
 * @property {string} title - Le titre de la sous-tâche.
 * @property {boolean} completed - Indique si la sous-tâche est terminée.
 */

/**
 * @typedef {Object} KanbanMetadata
 * @property {("todo"|"inprogress"|"done")} columnId - L'identifiant de la colonne / état.
 * @property {string[]} tags - Les étiquettes associées à la tâche.
 * @property {Subtask[]} subtasks - Liste des sous-tâches.
 * @property {string|null} gmailId - L'identifiant du thread Gmail lié.
 * @property {string|null} gmailSubject - L'objet de l'e-mail Gmail lié.
 * @property {string|null} gmailUrl - L'URL profonde vers l'e-mail Gmail.
 */

/**
 * @typedef {Object} ParsedTaskNotes
 * @property {string} description - La description textuelle propre de la tâche.
 * @property {KanbanMetadata} metadata - Les métadonnées Kanban extraites et validées.
 */

/**
 * Structure par défaut des métadonnées pour éviter les erreurs d'exécution
 * en cas d'absence ou de corruption des données.
 * @type {KanbanMetadata}
 */
const DEFAULT_METADATA = {
  columnId: "todo",
  tags: [],
  subtasks: [],
  gmailId: null,
  gmailSubject: null,
  gmailUrl: null
};

/**
 * Valide et nettoie un objet de métadonnées brut pour s'assurer qu'il respecte le schéma attendu.
 * @param {any} rawObj - Les métadonnées brutes issues du parsing JSON.
 * @returns {KanbanMetadata} Un objet de métadonnées propre et garanti valide.
 */
function validateMetadata(rawObj) {
  if (!rawObj || typeof rawObj !== "object") {
    return { ...DEFAULT_METADATA };
  }

  // 1. Validation de columnId
  let columnId = "todo";
  if (rawObj.columnId === "todo" || rawObj.columnId === "inprogress" || rawObj.columnId === "done") {
    columnId = rawObj.columnId;
  }

  // 2. Validation des tags (tableau de chaînes de caractères valides)
  let tags = [];
  if (Array.isArray(rawObj.tags)) {
    tags = rawObj.tags
      .map(tag => (typeof tag === "string" ? tag.trim() : ""))
      .filter(tag => tag.length > 0);
  }

  // 3. Validation des subtasks
  let subtasks = [];
  if (Array.isArray(rawObj.subtasks)) {
    subtasks = rawObj.subtasks
      .filter(sub => sub && typeof sub === "object" && typeof sub.title === "string")
      .map(sub => ({
        id: typeof sub.id === "string" ? sub.id.trim() : Math.random().toString(36).substring(2, 9),
        title: sub.title.trim(),
        completed: Boolean(sub.completed)
      }));
  }

  // 4. Validation des identifiants et chaînes Gmail
  const gmailId = typeof rawObj.gmailId === "string" ? rawObj.gmailId.trim() : null;
  const gmailSubject = typeof rawObj.gmailSubject === "string" ? rawObj.gmailSubject.trim() : null;
  
  let gmailUrl = null;
  if (typeof rawObj.gmailUrl === "string" && rawObj.gmailUrl.trim().startsWith("https://")) {
    gmailUrl = rawObj.gmailUrl.trim();
  }

  return {
    columnId,
    tags,
    subtasks,
    gmailId,
    gmailSubject,
    gmailUrl
  };
}

/**
 * Extrait la description textuelle propre et les métadonnées d'une tâche Google Tasks.
 * Cette fonction est tolérante aux pannes et gère les données corrompues.
 * @param {string|null|undefined} rawNotes - Le contenu brut du champ 'notes' de Google Tasks.
 * @returns {ParsedTaskNotes} Un objet contenant la { description, metadata }.
 */
function parseTaskNotes(rawNotes) {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { 
      description: "", 
      metadata: { ...DEFAULT_METADATA } 
    };
  }

  const parts = rawNotes.split(METADATA_DELIMITER);
  const description = parts[0].trim();
  
  // Si le délimiteur n'existe pas, on retourne la description et les métadonnées par défaut
  if (parts.length < 2) {
    return { 
      description, 
      metadata: { ...DEFAULT_METADATA } 
    };
  }

  try {
    const parsedMetadata = JSON.parse(parts[1].trim());
    const metadata = validateMetadata(parsedMetadata);
    return { description, metadata };
  } catch (error) {
    // En cas d'erreur de parsing (par exemple si l'utilisateur a modifié le JSON manuellement)
    console.warn("Erreur de lecture des métadonnées JSON. Restauration des valeurs par défaut.", error);
    return { 
      description: rawNotes.trim(), 
      metadata: { ...DEFAULT_METADATA } 
    };
  }
}

/**
 * Compile la description et les métadonnées au format brut pour l'API Google Tasks.
 * Elle nettoie également les données pour éviter d'enregistrer des structures lourdes ou invalides.
 * @param {string|null|undefined} description - La description rédigée par l'utilisateur.
 * @param {KanbanMetadata} metadata - Les métadonnées Kanban (columnId, tags, gmailUrl, etc.).
 * @returns {string} Le texte brut final prêt à être enregistré dans le champ 'notes' de Google Tasks.
 */
function serializeTaskNotes(description, metadata) {
  const cleanDescription = description ? description.trim() : "";
  const cleanMetadata = validateMetadata(metadata);
  const jsonString = JSON.stringify(cleanMetadata, null, 2);
  return `${cleanDescription}${METADATA_DELIMITER}${jsonString}`;
}

/**
 * Vérifie si une tâche est une tâche de configuration système pour le tableau.
 * @param {any} task - La tâche Google Tasks à analyser.
 * @returns {boolean} True s'il s'agit du fichier de configuration du tableau Kanban.
 */
function isConfigTask(task) {
  return Boolean(task && typeof task === "object" && task.title === "__KANBAN_CONFIG__");
}

// Export conditionnel CommonJS pour l'environnement de test Vitest/Node
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    METADATA_DELIMITER,
    DEFAULT_METADATA,
    validateMetadata,
    parseTaskNotes,
    serializeTaskNotes,
    isConfigTask
  };
}