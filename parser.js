/**
 * parser.js
 * * Ce module gère la sérialisation et la désérialisation des données.
 * Il permet d'encapsuler les métadonnées Kanban (colonnes, tags, liens Gmail)
 * directement dans le champ textuel 'notes' (description) d'une tâche Google Tasks.
 */

// Délimiteur unique pour isoler la description utilisateur des métadonnées système
const METADATA_DELIMITER = "\n\n--- KANBAN_METADATA ---\n";

/**
 * Structure par défaut des métadonnées pour éviter les erreurs d'exécution
 * en cas d'absence ou de corruption des données.
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
 * Extrait la description textuelle propre et les métadonnées d'une tâche Google Tasks.
 * Cette fonction est tolérante aux pannes et gère les données corrompues.
 * * @param {string} rawNotes - Le contenu brut du champ 'notes' de Google Tasks.
 * @returns {Object} Un objet contenant la { description: string, metadata: Object }.
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
    
    // Fusion sécurisée avec les valeurs par défaut pour garantir l'existence de chaque champ
    const metadata = {
      ...DEFAULT_METADATA,
      ...parsedMetadata
    };

    return { description, metadata };
  } catch (error) {
    // En cas d'erreur de parsing (par exemple si l'utilisateur a modifié le JSON sur mobile)
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
 * * @param {string} description - La description rédigée par l'utilisateur.
 * @param {Object} metadata - Les métadonnées Kanban (columnId, tags, gmailUrl, etc.).
 * @returns {string} Le texte brut final prêt à être enregistré dans le champ 'notes' de Google Tasks.
 */
function serializeTaskNotes(description, metadata) {
  const cleanDescription = description ? description.trim() : "";
  
  // Nettoyage et préparation de l'objet de métadonnées
  const cleanMetadata = {
    columnId: metadata.columnId || DEFAULT_METADATA.columnId,
    tags: Array.isArray(metadata.tags) ? metadata.tags : DEFAULT_METADATA.tags,
    subtasks: Array.isArray(metadata.subtasks) ? metadata.subtasks : DEFAULT_METADATA.subtasks,
    gmailId: metadata.gmailId || null,
    gmailSubject: metadata.gmailSubject || null,
    gmailUrl: metadata.gmailUrl || null
  };

  const jsonString = JSON.stringify(cleanMetadata, null, 2);
  return `${cleanDescription}${METADATA_DELIMITER}${jsonString}`;
}

/**
 * Vérifie si une tâche est une tâche de configuration système pour le tableau.
 * * @param {Object} task - La tâche Google Tasks à analyser.
 * @returns {boolean} True s'il s'agit du fichier de configuration du tableau Kanban.
 */
function isConfigTask(task) {
  return task && task.title === "__KANBAN_CONFIG__";
}