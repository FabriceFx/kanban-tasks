/**
 * src/sidepanel.js
 * Logiciel d'interaction du Panneau Latéral (Side Panel) Kanban Tasks.
 * Gère la communication OAuth2, les appels REST à Google Tasks, le Drag & Drop
 * et la synchronisation avec Gmail en temps réel.
 */

import { parseTaskNotes, serializeTaskNotes, isConfigTask } from "./parser.js";

// --- Traduction / Internationalisation ---
function getMessage(key, defaultValue = "") {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getMessage(key) || defaultValue;
  }
  return defaultValue;
}

function localizeDOM(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const message = chrome.i18n.getMessage(key);
    if (message) {
      if (key === "setup_step_2" || key === "setup_step_3") {
        el.innerHTML = message;
      } else {
        el.textContent = message;
      }
    }
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    const message = chrome.i18n.getMessage(key);
    if (message) el.placeholder = message;
  });
  root.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    const message = chrome.i18n.getMessage(key);
    if (message) el.title = message;
  });
}

// Surcharge de alert pour la traduction automatique
const originalAlert = window.alert;
window.alert = function(msg) {
  const alertMap = {
    "Impossible de modifier la tâche en mode hors-ligne. Veuillez rétablir votre connexion internet.": "alert_offline_modify_task",
    "Échec de la synchronisation avec Google Tasks. La tâche a été replacée à sa position d'origine.": "alert_sync_failed_rollback",
    "Impossible d'ajouter une tâche en mode hors-ligne.": "alert_offline_add_task",
    "Impossible de modifier la tâche en mode hors-ligne.": "alert_offline_edit_task",
    "Échec de la sauvegarde sur Google Tasks. Les modifications ont été annulées.": "alert_save_failed_rollback",
    "Impossible de supprimer la tâche en mode hors-ligne.": "alert_offline_delete_task",
    "Impossible de lier un e-mail en mode hors-ligne.": "alert_offline_link_email",
    "Une erreur est survenue lors de l'archivage avec Google Tasks. Certaines tâches ont été restaurées.": "alert_archive_failed_rollback"
  };
  const key = alertMap[msg];
  const localizedMsg = key ? getMessage(key, msg) : msg;
  originalAlert(localizedMsg);
};

// Surcharge de confirm pour la traduction automatique
const originalConfirm = window.confirm;
window.confirm = function(msg) {
  const confirmMap = {
    "Voulez-vous vraiment supprimer définitivement cette tâche ?": "delete_confirm"
  };
  
  let localizedMsg = msg;
  if (confirmMap[msg]) {
    localizedMsg = getMessage(confirmMap[msg], msg);
  } else if (msg.startsWith("Voulez-vous archiver ces")) {
    const match = msg.match(/\d+/);
    const count = match ? match[0] : "0";
    localizedMsg = getMessage("archive_confirm_plural", [count]) || msg;
  }
  
  return originalConfirm(localizedMsg);
};

// --- Constantes & Variables d'État ---
let authToken = null;
let activeListId = null;
let allTasks = {}; // Structure locale contenant les données des tâches chargées
let capturedEmail = null; // Stockage de l'e-mail capturé depuis Gmail

// Sélecteurs d'onglets
const tabKanban = document.getElementById("tab-kanban");
const tabSmart = document.getElementById("tab-smart");
const viewKanban = document.getElementById("view-kanban");
const viewSmart = document.getElementById("view-smart");

// Sélecteurs de Colonnes et Badges
const cols = {
  todo: document.getElementById("col-todo"),
  inprogress: document.getElementById("col-inprogress"),
  done: document.getElementById("col-done")
};

const colContainers = {
  todo: document.getElementById("col-todo-container"),
  inprogress: document.getElementById("col-inprogress-container"),
  done: document.getElementById("col-done-container")
};

const badges = {
  todo: document.getElementById("badge-todo"),
  inprogress: document.getElementById("badge-inprogress"),
  done: document.getElementById("badge-done")
};

const skeletons = {
  todo: document.getElementById("skeleton-todo"),
  inprogress: document.getElementById("skeleton-inprogress"),
  done: document.getElementById("skeleton-done")
};

// --- Initialisation au Chargement ---
document.addEventListener("DOMContentLoaded", () => {
  localizeDOM();
  setupEventListeners();
  initAuth();
  checkLastCapturedEmail();
});

// --- Configuration des Écouteurs d'Événements Statiques ---
function setupEventListeners() {
  // Navigation par onglets
  tabKanban.addEventListener("click", () => switchTab("kanban"));
  tabSmart.addEventListener("click", () => switchTab("smart"));

  // Sélecteur de tableau (liste de tâches)
  const boardSelect = document.getElementById("board-select");
  boardSelect.addEventListener("change", (e) => {
    activeListId = e.target.value;
    chrome.storage.local.set({ activeListId });
    loadTasks(activeListId);
  });

  // Boutons d'ajout rapide dans chaque colonne
  document.getElementById("btn-add-todo").addEventListener("click", () => triggerAddNewTask("todo"));
  document.getElementById("btn-add-inprogress").addEventListener("click", () => triggerAddNewTask("inprogress"));
  document.getElementById("btn-add-done").addEventListener("click", () => triggerAddNewTask("done"));
  document.getElementById("btn-archive-done").addEventListener("click", handleArchiveDoneTasks);

  // Panneau d'Édition
  document.getElementById("btn-close-editor").addEventListener("click", closeEditor);
  document.getElementById("btn-save-changes").addEventListener("click", saveChanges);
  document.getElementById("btn-delete-task").addEventListener("click", triggerDeleteTask);
  document.getElementById("btn-add-subtask").addEventListener("click", handleAddSubtaskClick);
  document.getElementById("new-subtask-title").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtaskClick();
    }
  });

  // Authentification et assistant
  document.getElementById("btn-login").addEventListener("click", () => authenticate(true));
  document.getElementById("btn-logout").addEventListener("click", logout);
  
  // Bouton Plein écran
  document.getElementById("btn-fullscreen").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
  });

  // Toast Gmail
  document.getElementById("btn-close-toast").addEventListener("click", hideGmailToast);
  document.getElementById("btn-add-gmail-task").addEventListener("click", openEditorWithCapturedEmail);

  // Drag and Drop natif sur les conteneurs de colonnes
  Object.keys(colContainers).forEach(columnId => {
    const container = colContainers[columnId];
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.classList.add("drag-over-active");
    });

    container.addEventListener("dragleave", () => {
      container.classList.remove("drag-over-active");
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-over-active");
      
      const cardId = e.dataTransfer.getData("text/plain");
      const cardElement = document.getElementById(cardId);
      const targetList = cols[columnId];

      if (cardElement && targetList && cardElement.parentElement !== targetList) {
        targetList.appendChild(cardElement);
        updateBadges();
        handleTaskColumnMove(cardId, columnId);
      }
    });
  });

  // Écoute des messages venant de background.js / content.js (Gmail)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "EMAIL_CAPTURED") {
      showGmailToast(message.data);
    }
  });

  // Écoute des changements de cache en temps réel (pour synchronisation inter-contextes)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && activeListId) {
      const cacheKey = `kanban_tasks_cache_${activeListId}`;
      if (changes[cacheKey]) {
        const newCache = changes[cacheKey].newValue;
        if (newCache && newCache.items) {
          const localKeys = Object.keys(allTasks);
          const incomingIds = newCache.items.map(t => t.id);
          
          const hasChanges = localKeys.length !== incomingIds.length || 
            newCache.items.some(t => {
              const local = allTasks[t.id];
              return !local || local.columnId !== t.columnId || local.title !== t.title || local.desc !== t.desc;
            });
            
          if (hasChanges) {
            console.log("[Kanban] Mise à jour en temps réel détectée dans le panneau latéral");
            renderTasksFromData(newCache.items);
            if (!navigator.onLine) {
              setSyncStatus("offline", "Hors-ligne (Cache)");
            } else {
              setSyncStatus("connected", "À jour (Synchro)");
            }
          }
        }
      }
    }
  });

  // Affichage de l'ID d'extension dans l'assistant
  const displayIdEl = document.getElementById("extension-id-display");
  if (displayIdEl) {
    displayIdEl.innerText = chrome.runtime.id;
  }
}

// --- Authentification & Jeton ---
async function initAuth() {
  setSyncStatus("connecting", "Recherche de jeton...");
  const storage = await chrome.storage.local.get(["activeListId"]);
  activeListId = storage.activeListId || null;
  authenticate(false);
}

function authenticate(interactive = false) {
  setSyncStatus("connecting", "Authentification...");
  const errorEl = document.getElementById("auth-error-display");
  if (errorEl) {
    errorEl.classList.add("hidden");
    errorEl.innerHTML = "";
  }

  chrome.runtime.sendMessage({ type: "GET_TASKS_TOKEN", interactive }, (response) => {
    const errorEl = document.getElementById("auth-error-display");
    if (chrome.runtime.lastError) {
      console.error("[Kanban] Erreur de communication avec l'extension :", chrome.runtime.lastError);
      authToken = null;
      const setupWizard = document.getElementById("setup-wizard");
      if (setupWizard) setupWizard.classList.remove("hidden");
      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) btnLogout.classList.add("hidden");
      setSyncStatus("offline", "Erreur extension");
      
      const boardSelect = document.getElementById("board-select");
      if (boardSelect) {
        boardSelect.innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
      }
      
      if (errorEl) {
        errorEl.innerHTML = `<strong>Erreur de communication :</strong><br>Impossible de se connecter au service worker de l'extension.<br><span class="text-[10px] mt-1 block">Essayez de recharger la page. (${chrome.runtime.lastError.message})</span>`;
        errorEl.classList.remove("hidden");
      }
      return;
    }
    if (response && response.success && response.token) {
      authToken = response.token;
      const setupWizard = document.getElementById("setup-wizard");
      if (setupWizard) setupWizard.classList.add("hidden");
      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) btnLogout.classList.remove("hidden");
      setSyncStatus("connected", "Connecté");
      loadBoards();
    } else {
      authToken = null;
      const setupWizard = document.getElementById("setup-wizard");
      if (setupWizard) setupWizard.classList.remove("hidden");
      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) btnLogout.classList.add("hidden");
      setSyncStatus("offline", "Non authentifié");
      
      const boardSelect = document.getElementById("board-select");
      if (boardSelect) {
        boardSelect.innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
      }

      const errMsg = response && response.error ? response.error : "Échec d'authentification";
      if (interactive) {
        console.error("[Kanban] Échec de l'authentification :", errMsg);
        if (errorEl) {
          if (errMsg.includes("OAuth2 client not found") || errMsg.includes("OAuth2")) {
            errorEl.innerHTML = `<strong>Erreur de configuration Google Cloud :</strong><br>Le client_id dans manifest.json n'est pas associé à l'ID d'extension <code>${chrome.runtime.id}</code>.<br><span class="text-[10px] mt-1 block">Dépliez la section ci-dessous pour l'associer.</span>`;
          } else {
            errorEl.innerText = `Erreur : ${errMsg}`;
          }
          errorEl.classList.remove("hidden");
        }
      }
    }
  });
}

function logout() {
  if (!authToken) return;
  chrome.runtime.sendMessage({ type: "LOGOUT_USER", token: authToken }, () => {
    authToken = null;
    document.getElementById("setup-wizard").classList.remove("hidden");
    document.getElementById("btn-logout").classList.add("hidden");
    setSyncStatus("offline", "Déconnecté");
    
    const boardSelect = document.getElementById("board-select");
    boardSelect.innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
    clearColumns();
  });
}

// --- Gestion de l'état de synchronisation visuel ---
function setSyncStatus(state, text) {
  const dot = document.getElementById("sync-dot");
  const label = document.getElementById("sync-text");
  if (!dot || !label) return;
  
  const translationMap = {
    "Hors-ligne (Cache)": "status_offline_cache",
    "À jour (Synchro)": "status_synced",
    "Recherche de jeton...": "status_searching_token",
    "Authentification...": "status_authenticating",
    "Connecté": "status_connected",
    "Non authentifié": "status_unauthenticated",
    "Déconnecté": "status_logged_out",
    "Erreur Sync": "status_sync_error",
    "Synchro listes...": "status_sync_lists",
    "Erreur réseau": "status_network_error",
    "Vide": "status_empty",
    "Chargement tâches...": "status_loading_tasks",
    "À jour (Cache)": "status_cache_up_to_date",
    "À jour": "status_up_to_date",
    "Enregistrement...": "status_saving",
    "Déplacé !": "status_moved",
    "Sync échec": "status_sync_failed",
    "Création tâche...": "status_creating_task",
    "Créée !": "status_created",
    "Échec création": "status_create_failed",
    "Sauvegarde...": "status_saving_changes",
    "Modifiée !": "status_modified",
    "Suppression...": "status_deleting",
    "Supprimée": "status_deleted",
    "Échec suppression": "status_delete_failed",
    "Liaison e-mail...": "status_linking_email",
    "Lié !": "status_linked",
    "Échec liaison": "status_link_failed",
    "Archivage...": "status_archiving",
    "Archivées !": "status_archived"
  };

  const key = translationMap[text];
  const localizedText = key ? getMessage(key, text) : text;
  label.innerText = localizedText;
  
  dot.className = "w-1.5 h-1.5 rounded-full transition-colors duration-300 ";
  if (state === "connected") {
    dot.className += "bg-emerald-500 shadow-sm shadow-emerald-200";
  } else if (state === "connecting") {
    dot.className += "bg-blue-500 animate-pulse";
  } else if (state === "offline") {
    dot.className += "bg-amber-500";
  } else if (state === "error") {
    dot.className += "bg-red-500 shadow-sm shadow-red-200";
  }
}

// --- Appels API REST Google Tasks ---
async function apiCall(endpoint, method = "GET", body = null) {
  if (!authToken) {
    authenticate(false);
    throw new Error("Authentification requise.");
  }

  const url = `https://tasks.googleapis.com/tasks/v1${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      logout();
      throw new Error("Jeton d'accès expiré. Veuillez vous reconnecter.");
    }
    
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erreur HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur d'appel API [${method} ${endpoint}]:`, error);
    setSyncStatus("error", "Erreur Sync");
    throw error;
  }
}

// --- Chargement des Tableaux (Listes de Tâches) ---
async function loadBoards() {
  setSyncStatus("connecting", "Synchro listes...");
  
  try {
    const cache = await chrome.storage.local.get("kanban_lists_cache");
    const cachedData = cache.kanban_lists_cache;
    
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      console.log("[Kanban] Utilisation du cache pour les listes (sidepanel)");
      renderBoards(cachedData.items);
      return;
    }
  } catch (err) {
    console.warn("[Kanban] Échec lecture cache listes :", err);
  }

  try {
    const data = await apiCall("/users/@me/lists");
    const items = (data && data.items) || [];
    
    await chrome.storage.local.set({
      kanban_lists_cache: {
        timestamp: Date.now(),
        items
      }
    });
    
    renderBoards(items);
  } catch (error) {
    console.error("[Kanban] Erreur réseau lors de la récupération des listes (sidepanel) :", error);
    try {
      const cache = await chrome.storage.local.get("kanban_lists_cache");
      const cachedData = cache.kanban_lists_cache;
      if (cachedData && cachedData.items) {
        console.log("[Kanban] Fallback hors-ligne sur cache expiré pour les listes (sidepanel)");
        renderBoards(cachedData.items, true);
        return;
      }
    } catch (e) {}
    
    setSyncStatus("error", "Erreur réseau");
    const boardSelect = document.getElementById("board-select");
    if (boardSelect) boardSelect.innerHTML = '<option value="" disabled>Erreur de connexion</option>';
  }
}

function renderBoards(items, isOffline = false) {
  const boardSelect = document.getElementById("board-select");
  if (!boardSelect) return;
  boardSelect.innerHTML = "";

  if (items.length > 0) {
    items.forEach(list => {
      const option = document.createElement("option");
      option.value = list.id;
      option.innerText = list.title + (isOffline ? " (hors-ligne)" : "");
      boardSelect.appendChild(option);
    });

    if (activeListId && Array.from(boardSelect.options).some(opt => opt.value === activeListId)) {
      boardSelect.value = activeListId;
    } else {
      activeListId = items[0].id;
      boardSelect.value = activeListId;
      chrome.storage.local.set({ activeListId });
    }
    loadTasks(activeListId);
    if (isOffline) {
      setSyncStatus("offline", "Hors-ligne (Cache)");
    }
  } else {
    boardSelect.innerHTML = '<option value="" disabled>Aucun tableau trouvé</option>';
    setSyncStatus("connected", "Vide");
  }
}

// --- Chargement et Rendu des Tâches ---
async function loadTasks(listId) {
  if (!listId) return;
  
  clearColumns();
  toggleSkeletons(true);
  setSyncStatus("connecting", "Chargement tâches...");

  const cacheKey = `kanban_tasks_cache_${listId}`;
  
  try {
    const cache = await chrome.storage.local.get(cacheKey);
    const cachedData = cache[cacheKey];
    
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      console.log("[Kanban] Utilisation du cache pour les tâches de", listId, "(sidepanel)");
      toggleSkeletons(false);
      renderTasksFromData(cachedData.items);
      if (!navigator.onLine) {
        setSyncStatus("offline", "Hors-ligne (Cache)");
      } else {
        setSyncStatus("connected", "À jour (Cache)");
      }
      return;
    }
  } catch (err) {
    console.warn("[Kanban] Échec lecture cache tâches :", err);
  }

  try {
    const data = await apiCall(`/lists/${listId}/tasks?showCompleted=true&showHidden=true`);
    toggleSkeletons(false);

    const taskItems = data.items || [];
    const formattedTasks = [];

    taskItems.forEach(rawTask => {
      if (isConfigTask(rawTask)) return;

      const { description, metadata } = parseTaskNotes(rawTask.notes);
      if (metadata.archived === true) return;
      
      let columnId = metadata.columnId || "todo";
      if (rawTask.status === "completed") {
        columnId = "done";
      }

      const task = {
        id: rawTask.id,
        title: rawTask.title,
        desc: description,
        date: rawTask.due ? formatDateForInput(rawTask.due) : "",
        displayDate: rawTask.due ? formatDateFriendly(rawTask.due) : "",
        tags: metadata.tags || [],
        subtasks: metadata.subtasks || [],
        gmailId: metadata.gmailId,
        gmailSubject: metadata.gmailSubject,
        gmailUrl: metadata.gmailUrl,
        columnId,
        completed: rawTask.status === "completed",
        archived: false
      };

      formattedTasks.push(task);
    });

    await chrome.storage.local.set({
      [cacheKey]: {
        timestamp: Date.now(),
        items: formattedTasks
      }
    });

    renderTasksFromData(formattedTasks);
    setSyncStatus("connected", "À jour");
  } catch (error) {
    console.error("[Kanban] Erreur de récupération des tâches :", error);
    toggleSkeletons(false);
    try {
      const cache = await chrome.storage.local.get(cacheKey);
      const cachedData = cache[cacheKey];
      if (cachedData && cachedData.items) {
        console.log("[Kanban] Fallback hors-ligne sur cache expiré pour les tâches (sidepanel)");
        renderTasksFromData(cachedData.items);
        setSyncStatus("offline", "Hors-ligne (Cache)");
        return;
      }
    } catch (e) {}

    setSyncStatus("error", "Erreur réseau");
  }
}

function renderTasksFromData(tasks) {
  clearColumns();
  allTasks = {};
  tasks.forEach(task => {
    if (task.archived === true) return;
    allTasks[task.id] = task;
    renderTaskCard(task);
  });
  updateBadges();
}

// --- Rendu des cartes dans le DOM ---
function renderTaskCard(task) {
  const targetCol = cols[task.columnId];
  if (!targetCol) return;

  const card = document.createElement("div");
  card.id = task.id;
  card.draggable = true;
  card.className = "bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group card-transition";
  
  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="flex flex-wrap gap-1 mb-2">`;
    task.tags.forEach(tag => {
      const isUrgent = tag.toLowerCase() === "urgent";
      const colorClass = isUrgent 
        ? "bg-red-50 text-red-700 border-red-100" 
        : "bg-blue-50 text-blue-700 border-blue-100";
      tagsHtml += `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorClass}">${tag}</span>`;
    });
    tagsHtml += `</div>`;
  }

  const titleClass = task.completed 
    ? "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]" 
    : "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
  
  const descHtml = task.desc 
    ? `<p class="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">${escapeHtml(task.desc)}</p>` 
    : "";

  let footerHtml = "";
  if (task.displayDate || task.gmailUrl) {
    footerHtml = `<div class="flex items-center justify-between mt-3.5 pt-2.5 border-t border-gray-50 text-[10px] text-gray-400">`;
    
    if (task.displayDate) {
      footerHtml += `
        <span class="flex items-center gap-1 font-medium text-gray-500">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"></path>
          </svg>
          ${task.displayDate}
        </span>`;
    } else {
      footerHtml += "<span></span>";
    }

    if (task.gmailUrl) {
      footerHtml += `
        <span class="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold select-none">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          Gmail
        </span>`;
    }

    footerHtml += `</div>`;
  }

  let subtasksHtml = "";
  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter(s => s.completed).length;
    const totalCount = task.subtasks.length;
    const percent = Math.round((completedCount / totalCount) * 100);
    subtasksHtml = `
      <div class="mt-2.5 flex flex-col gap-1 w-full">
        <div class="flex items-center gap-1 text-[10px] text-gray-400">
          <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${completedCount}/${totalCount} ${getMessage("subtasks_progression", "sous-tâches")}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div class="bg-blue-600 h-full rounded-full transition-all duration-300" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    ${tagsHtml}
    <h4 class="${titleClass}">${escapeHtml(task.title)}</h4>
    ${descHtml}
    ${subtasksHtml}
    ${footerHtml}
  `;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      card.classList.add("opacity-40");
      card.style.transform = "scale(0.96) rotate(-2deg)";
    }, 0);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("opacity-40");
    card.style.transform = "";
  });

  card.addEventListener("click", () => openEditor(task.id));
  targetCol.appendChild(card);
}

// --- Drag & Drop Persistance dans l'API ---
async function handleTaskColumnMove(taskId, columnId) {
  const task = allTasks[taskId];
  if (!task) return;
  const previousColumn = task.columnId;
  const previousCompleted = task.completed;

  if (!navigator.onLine) {
    alert("Impossible de modifier la tâche en mode hors-ligne. Veuillez rétablir votre connexion internet.");
    const cardEl = document.getElementById(taskId);
    if (cardEl) {
      const targetCol = cols[previousColumn];
      if (targetCol) {
        targetCol.appendChild(cardEl);
      }
    }
    updateBadges();
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  // 1. Mise à jour immédiate locale de la tâche
  task.columnId = columnId;
  const makeCompleted = (columnId === "done");
  task.completed = makeCompleted;

  // Mise à jour de la classe CSS du titre de la carte immédiatement
  const cardEl = document.getElementById(taskId);
  if (cardEl) {
    const h4 = cardEl.querySelector("h4");
    if (h4) {
      if (makeCompleted) {
        h4.className = "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]";
      } else {
        h4.className = "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
      }
    }
  }

  updateBadges();

  // Mise à jour immédiate du cache local
  const cacheKey = `kanban_tasks_cache_${activeListId}`;
  const saveCache = async () => {
    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          timestamp: Date.now(),
          items: Object.values(allTasks)
        }
      });
    } catch (e) {
      console.warn("Échec écriture cache :", e);
    }
  };
  await saveCache();

  setSyncStatus("connecting", "Enregistrement...");

  // 2. Appel API asynchrone en arrière-plan
  try {
    const rawNotes = serializeTaskNotes(task.desc, {
      columnId,
      tags: task.tags,
      subtasks: task.subtasks,
      gmailId: task.gmailId,
      gmailSubject: task.gmailSubject,
      gmailUrl: task.gmailUrl,
      archived: task.archived || false
    });

    const body = {
      notes: rawNotes,
      status: makeCompleted ? "completed" : "needsAction"
    };

    if (!makeCompleted) {
      body.completed = null;
    }

    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);
    setSyncStatus("connected", "Déplacé !");
  } catch (error) {
    console.error("Échec de déplacement de colonne (sidepanel) :", error);
    // 3. Rollback
    task.columnId = previousColumn;
    task.completed = previousCompleted;

    if (cardEl) {
      const targetCol = cols[previousColumn];
      if (targetCol) {
        targetCol.appendChild(cardEl);
        const h4 = cardEl.querySelector("h4");
        if (h4) {
          if (previousCompleted) {
            h4.className = "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]";
          } else {
            h4.className = "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
          }
        }
      }
    }
    updateBadges();
    await saveCache();

    alert("Échec de la synchronisation avec Google Tasks. La tâche a été replacée à sa position d'origine.");
    setSyncStatus("error", "Sync échec");
  }
}

// --- Ajout d'une nouvelle tâche ---
async function triggerAddNewTask(columnId) {
  if (!navigator.onLine) {
    alert("Impossible d'ajouter une tâche en mode hors-ligne.");
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  const tempTask = {
    title: "Nouvelle tâche",
    desc: "",
    columnId,
    tags: [],
    subtasks: [],
    completed: (columnId === "done")
  };

  setSyncStatus("connecting", "Création tâche...");

  try {
    const rawNotes = serializeTaskNotes(tempTask.desc, {
      columnId,
      tags: tempTask.tags,
      subtasks: tempTask.subtasks
    });

    const body = {
      title: tempTask.title,
      notes: rawNotes,
      status: tempTask.completed ? "completed" : "needsAction"
    };

    const createdRawTask = await apiCall(`/lists/${activeListId}/tasks`, "POST", body);
    
    const task = {
      id: createdRawTask.id,
      title: createdRawTask.title,
      desc: tempTask.desc,
      date: "",
      displayDate: "",
      tags: tempTask.tags,
      subtasks: tempTask.subtasks,
      columnId,
      completed: tempTask.completed
    };

    allTasks[task.id] = task;
    renderTaskCard(task);
    updateBadges();

    const cacheKey = `kanban_tasks_cache_${activeListId}`;
    await chrome.storage.local.set({
      [cacheKey]: {
        timestamp: Date.now(),
        items: Object.values(allTasks)
      }
    });
    
    openEditor(task.id);
    setSyncStatus("connected", "Créée !");
  } catch (error) {
    setSyncStatus("error", "Échec création");
  }
}

// --- Édition et Mise à Jour ---
function openEditor(taskId) {
  const task = allTasks[taskId];
  if (!task) return;

  document.getElementById("edit-id").value = taskId;
  document.getElementById("edit-title").value = task.title;
  document.getElementById("edit-desc").value = task.desc;
  document.getElementById("edit-date").value = task.date;
  document.getElementById("edit-status").value = task.columnId;
  document.getElementById("edit-tags").value = task.tags.join(", ");
  document.getElementById("new-subtask-title").value = "";
  renderSubtasksList(task);

  const gmailContext = document.getElementById("gmail-context");
  if (task.gmailUrl) {
    gmailContext.classList.remove("hidden");
    document.getElementById("gmail-subject").innerText = task.gmailSubject;
    document.getElementById("gmail-link").href = task.gmailUrl;
  } else {
    gmailContext.classList.add("hidden");
  }

  document.getElementById("editor-panel").classList.remove("hidden");
}

function closeEditor() {
  document.getElementById("editor-panel").classList.add("hidden");
}

async function saveChanges() {
  const taskId = document.getElementById("edit-id").value;
  const task = allTasks[taskId];
  if (!task) return;

  if (!navigator.onLine) {
    alert("Impossible de modifier la tâche en mode hors-ligne.");
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  const previousState = {
    title: task.title,
    desc: task.desc,
    date: task.date,
    displayDate: task.displayDate,
    columnId: task.columnId,
    tags: [...task.tags],
    completed: task.completed
  };

  const newTitle = document.getElementById("edit-title").value.trim() || "Sans titre";
  const newDesc = document.getElementById("edit-desc").value;
  const newDate = document.getElementById("edit-date").value;
  const newColumnId = document.getElementById("edit-status").value;
  
  const tagsInput = document.getElementById("edit-tags").value;
  const newTags = tagsInput 
    ? tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0) 
    : [];

  const makeCompleted = (newColumnId === "done");

  // 1. Fermer l'éditeur immédiatement
  closeEditor();

  // 2. Mettre à jour les données locales et l'UI immédiatement
  task.title = newTitle;
  task.desc = newDesc;
  task.date = newDate;
  task.displayDate = newDate ? formatDateFriendly(newDate) : "";
  task.columnId = newColumnId;
  task.tags = newTags;
  task.completed = makeCompleted;

  const cardEl = document.getElementById(taskId);
  if (cardEl) cardEl.remove();
  
  renderTaskCard(task);
  updateBadges();

  // Enregistrer le cache local immédiatement
  const cacheKey = `kanban_tasks_cache_${activeListId}`;
  const saveCache = async () => {
    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          timestamp: Date.now(),
          items: Object.values(allTasks)
        }
      });
    } catch (e) {
      console.warn("Échec écriture cache :", e);
    }
  };
  await saveCache();

  setSyncStatus("connecting", "Sauvegarde...");

  // 3. Appel de mise à jour réseau asynchrone
  try {
    const rawNotes = serializeTaskNotes(newDesc, {
      columnId: newColumnId,
      tags: newTags,
      subtasks: task.subtasks,
      gmailId: task.gmailId,
      gmailSubject: task.gmailSubject,
      gmailUrl: task.gmailUrl,
      archived: task.archived || false
    });

    const body = {
      title: newTitle,
      notes: rawNotes,
      status: makeCompleted ? "completed" : "needsAction",
      due: newDate ? new Date(newDate).toISOString() : null
    };

    if (!makeCompleted) {
      body.completed = null;
    }

    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);
    setSyncStatus("connected", "Modifiée !");
  } catch (error) {
    console.error("Échec de sauvegarde des modifications (sidepanel) :", error);
    // 4. Rollback
    Object.assign(task, previousState);

    const currentCard = document.getElementById(taskId);
    if (currentCard) currentCard.remove();
    renderTaskCard(task);
    updateBadges();
    await saveCache();

    alert("Échec de la sauvegarde sur Google Tasks. Les modifications ont été annulées.");
    setSyncStatus("error", "Sync échec");
  }
}

async function triggerDeleteTask() {
  if (!navigator.onLine) {
    alert("Impossible de supprimer la tâche en mode hors-ligne.");
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  const taskId = document.getElementById("edit-id").value;
  const task = allTasks[taskId];
  if (!task) return;

  if (!confirm("Voulez-vous vraiment supprimer définitivement cette tâche ?")) return;

  setSyncStatus("connecting", "Suppression...");

  try {
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "DELETE");
    
    const cardEl = document.getElementById(taskId);
    if (cardEl) cardEl.remove();

    delete allTasks[taskId];
    updateBadges();

    const cacheKey = `kanban_tasks_cache_${activeListId}`;
    await chrome.storage.local.set({
      [cacheKey]: {
        timestamp: Date.now(),
        items: Object.values(allTasks)
      }
    });

    closeEditor();
    setSyncStatus("connected", "Supprimée");
  } catch (error) {
    setSyncStatus("error", "Échec suppression");
  }
}

// --- Messagerie Gmail (EMAIL_CAPTURED) ---
function showGmailToast(emailData) {
  capturedEmail = emailData;
  const toast = document.getElementById("gmail-toast");
  const subjectEl = document.getElementById("gmail-toast-subject");
  if (toast && subjectEl) {
    subjectEl.innerText = emailData.title;
    toast.classList.remove("translate-y-24", "opacity-0", "pointer-events-none");
    toast.classList.add("translate-y-0", "opacity-100");
  }
}

function hideGmailToast() {
  const toast = document.getElementById("gmail-toast");
  if (toast) {
    toast.classList.add("translate-y-24", "opacity-0", "pointer-events-none");
    toast.classList.remove("translate-y-0", "opacity-100");
    chrome.storage.local.remove("lastCapturedEmail").catch(() => {});
  }
}

async function openEditorWithCapturedEmail() {
  if (!navigator.onLine) {
    alert("Impossible de lier un e-mail en mode hors-ligne.");
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  if (!capturedEmail) return;

  setSyncStatus("connecting", "Liaison e-mail...");
  hideGmailToast();
  chrome.storage.local.remove("lastCapturedEmail").catch(() => {});

  try {
    const rawNotes = serializeTaskNotes(`Consulter l'e-mail lié ci-dessous pour plus de détails.`, {
      columnId: "todo",
      tags: ["Gmail"],
      subtasks: [],
      gmailId: capturedEmail.gmailId,
      gmailSubject: capturedEmail.title,
      gmailUrl: capturedEmail.gmailUrl
    });

    const body = {
      title: capturedEmail.title,
      notes: rawNotes,
      status: "needsAction"
    };

    const createdRawTask = await apiCall(`/lists/${activeListId}/tasks`, "POST", body);

    const task = {
      id: createdRawTask.id,
      title: createdRawTask.title,
      desc: `Consulter l'e-mail lié ci-dessous pour plus de détails.`,
      date: "",
      displayDate: "",
      tags: ["Gmail"],
      subtasks: [],
      gmailId: capturedEmail.gmailId,
      gmailSubject: capturedEmail.title,
      gmailUrl: capturedEmail.gmailUrl,
      columnId: "todo",
      completed: false
    };

    allTasks[task.id] = task;
    renderTaskCard(task);
    updateBadges();

    const cacheKey = `kanban_tasks_cache_${activeListId}`;
    await chrome.storage.local.set({
      [cacheKey]: {
        timestamp: Date.now(),
        items: Object.values(allTasks)
      }
    });
    
    openEditor(task.id);
    setSyncStatus("connected", "Lié !");
  } catch (error) {
    setSyncStatus("error", "Échec liaison");
  }

  capturedEmail = null;
}

async function checkLastCapturedEmail() {
  try {
    const storage = await chrome.storage.local.get(["lastCapturedEmail"]);
    if (storage.lastCapturedEmail) {
      showGmailToast(storage.lastCapturedEmail);
    }
  } catch (err) {
    console.error("Erreur lors du décodage de l'e-mail stocké :", err);
  }
}

// ============================================================================
// VUE SMART / OBJECTIF TRAVAIL
// ============================================================================
function switchTab(tab) {
  if (tab === "kanban") {
    tabKanban.className = "flex-1 pb-2 flex items-center justify-center gap-2 font-bold border-b-2 border-[#0b57d0] text-[#0b57d0] transition-all";
    tabSmart.className = "flex-1 pb-2 flex items-center justify-center gap-2 font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-all";
    viewKanban.classList.remove("hidden");
    viewSmart.classList.add("hidden");
  } else {
    tabSmart.className = "flex-1 pb-2 flex items-center justify-center gap-2 font-bold border-b-2 border-[#0b57d0] text-[#0b57d0] transition-all";
    tabKanban.className = "flex-1 pb-2 flex items-center justify-center gap-2 font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-all";
    viewKanban.classList.add("hidden");
    viewSmart.classList.remove("hidden");
    renderSmartView();
  }
}

function renderSmartView() {
  const todayContainer = document.getElementById("smart-today");
  const weekContainer = document.getElementById("smart-week");
  if (!todayContainer || !weekContainer) return;
  
  todayContainer.innerHTML = "";
  weekContainer.innerHTML = "";

  const todayStr = getLocalDateString(new Date());
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = getLocalDateString(nextWeek);

  let todayCount = 0;
  let weekCount = 0;

  Object.values(allTasks).forEach(task => {
    if (task.completed || !task.date) return;

    const taskDateStr = task.date;

    if (taskDateStr === todayStr) {
      cloneCardToContainer(task, todayContainer);
      todayCount++;
    } else if (taskDateStr > todayStr && taskDateStr <= nextWeekStr) {
      cloneCardToContainer(task, weekContainer);
      weekCount++;
    }
  });

  if (todayCount === 0) {
    todayContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4 bg-white rounded-xl border border-gray-100">Aucune tâche planifiée pour aujourd'hui.</p>`;
  }
  
  if (weekCount === 0) {
    weekContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4 bg-white rounded-xl border border-gray-100">Aucune tâche planifiée pour cette semaine.</p>`;
  }
}

function cloneCardToContainer(task, container) {
  const card = document.createElement("div");
  card.className = "bg-white/95 border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 hover:border-blue-200 transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 duration-250";
  
  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="flex flex-wrap gap-1">`;
    task.tags.forEach(tag => {
      const isUrgent = tag.toLowerCase() === "urgent";
      const color = isUrgent ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100";
      tagsHtml += `<span class="text-[8px] font-bold px-2 py-0.5 rounded-full border ${color}">${tag}</span>`;
    });
    tagsHtml += `</div>`;
  }

  card.innerHTML = `
    ${tagsHtml}
    <h4 class="font-semibold text-xs text-gray-800">${escapeHtml(task.title)}</h4>
    ${task.desc ? `<p class="text-[11px] text-gray-400 line-clamp-1">${escapeHtml(task.desc)}</p>` : ""}
    <div class="flex items-center justify-between text-[10px] text-gray-455 pt-2.5 border-t border-gray-50 mt-3">
      <span class="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">${task.displayDate}</span>
      <span class="text-gray-400 uppercase tracking-widest font-extrabold text-[8px]">${task.columnId === "inprogress" ? "En cours" : "À faire"}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    switchTab("kanban");
    setTimeout(() => openEditor(task.id), 150);
  });

  container.appendChild(card);
}

// --- Utilitaires ---
function clearColumns() {
  Object.values(cols).forEach(col => { if (col) col.innerHTML = ""; });
}

function toggleSkeletons(show) {
  Object.values(skeletons).forEach(skeleton => {
    if (skeleton) {
      if (show) skeleton.classList.remove("hidden");
      else skeleton.classList.add("hidden");
    }
  });
}

function updateBadges() {
  Object.keys(cols).forEach(colId => {
    if (badges[colId] && cols[colId]) {
      const count = cols[colId].children.length;
      badges[colId].innerText = count;
      if (colId === "done") {
        const btnArchive = document.getElementById("btn-archive-done");
        if (btnArchive) {
          if (count > 0) {
            btnArchive.classList.remove("hidden");
          } else {
            btnArchive.classList.add("hidden");
          }
        }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateFriendly(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

function formatDateForInput(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  return date.toISOString().split('T')[0];
}

function getLocalDateString(date) {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
}

function isUserTyping() {
  const activeEl = document.activeElement;
  if (!activeEl) return false;
  return (
    activeEl.tagName === "INPUT" ||
    activeEl.tagName === "TEXTAREA" ||
    activeEl.isContentEditable ||
    activeEl.hasAttribute("contenteditable") ||
    activeEl.getAttribute("role") === "textbox"
  );
}

// Gestion des raccourcis clavier du panneau latéral
window.addEventListener("keydown", (e) => {
  // Escape : Fermeture de l'éditeur ou du toast Gmail (toujours autorisé, même en cours de saisie)
  if (e.key === "Escape" || e.keyCode === 27) {
    const editor = document.getElementById("editor-panel");
    const toast = document.getElementById("gmail-toast");
    let closedAny = false;

    if (editor && !editor.classList.contains("hidden")) {
      closeEditor();
      closedAny = true;
    }
    if (toast && !toast.classList.contains("hidden")) {
      hideGmailToast();
      closedAny = true;
    }

    if (closedAny) {
      e.preventDefault();
      e.stopPropagation();
    }
    return;
  }

  // Vérifier si l'utilisateur est en train de saisir du texte
  if (isUserTyping()) return;

  // N ou n : Créer une nouvelle tâche dans la colonne "À faire"
  if ((e.key === "n" || e.key === "N" || e.keyCode === 78) && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    triggerAddNewTask("todo");
    return;
  }

  // Alt + T : Alterne entre l'onglet "Tableau Kanban" et "Objectif Travail"
  if (e.altKey && (e.key === "t" || e.key === "T" || e.keyCode === 84)) {
    e.preventDefault();
    const viewKanban = document.getElementById("view-kanban");
    if (viewKanban) {
      if (viewKanban.classList.contains("hidden")) {
        switchTab("kanban");
      } else {
        switchTab("smart");
      }
    }
  }
}, true); // Phase de capture


// ============================================================================
// GESTION DYNAMIQUE ET INTERACTIVE DES SOUS-TÂCHES
// ============================================================================
function updateTaskCardContent(task) {
  const cardEl = document.getElementById(task.id);
  if (!cardEl) return;

  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="flex flex-wrap gap-1 mb-2">`;
    task.tags.forEach(tag => {
      const isUrgent = tag.toLowerCase() === "urgent";
      const colorClass = isUrgent 
        ? "bg-red-50 text-red-700 border-red-100" 
        : "bg-blue-50 text-blue-700 border-blue-100";
      tagsHtml += `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorClass}">${tag}</span>`;
    });
    tagsHtml += `</div>`;
  }

  const titleClass = task.completed 
    ? "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]" 
    : "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
  
  const descHtml = task.desc 
    ? `<p class="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">${escapeHtml(task.desc)}</p>` 
    : "";

  let subtasksHtml = "";
  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter(s => s.completed).length;
    const totalCount = task.subtasks.length;
    const percent = Math.round((completedCount / totalCount) * 100);
    subtasksHtml = `
      <div class="mt-2.5 flex flex-col gap-1 w-full">
        <div class="flex items-center gap-1 text-[10px] text-gray-400">
          <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${completedCount}/${totalCount} ${getMessage("subtasks_progression", "sous-tâches")}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div class="bg-blue-600 h-full rounded-full transition-all duration-300" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }

  let footerHtml = "";
  if (task.displayDate || task.gmailUrl) {
    footerHtml = `<div class="flex items-center justify-between mt-3.5 pt-2.5 border-t border-gray-50 text-[10px] text-gray-400">`;
    if (task.displayDate) {
      footerHtml += `
        <span class="flex items-center gap-1 font-medium text-gray-500">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"></path>
          </svg>
          ${task.displayDate}
        </span>`;
    } else {
      footerHtml += "<span></span>";
    }
    if (task.gmailUrl) {
      footerHtml += `
        <span class="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold select-none">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          Gmail
        </span>`;
    }
    footerHtml += `</div>`;
  }

  cardEl.innerHTML = `
    ${tagsHtml}
    <h4 class="${titleClass}">${escapeHtml(task.title)}</h4>
    ${descHtml}
    ${subtasksHtml}
    ${footerHtml}
  `;
}

async function saveSubtasksOptimistic(task) {
  // 1. Mettre à jour l'UI visuelle immédiate de la carte
  updateTaskCardContent(task);

  // 2. Mettre à jour le cache local immédiatement
  const cacheKey = `kanban_tasks_cache_${activeListId}`;
  const saveCache = async () => {
    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          timestamp: Date.now(),
          items: Object.values(allTasks)
        }
      });
    } catch (e) {
      console.warn("Échec écriture cache :", e);
    }
  };
  await saveCache();

  // 3. Appel réseau en arrière-plan
  if (!navigator.onLine) return;

  try {
    const rawNotes = serializeTaskNotes(task.desc, {
      columnId: task.columnId, tags: task.tags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl,
      archived: task.archived || false
    });
    const body = {
      notes: rawNotes,
      status: task.completed ? "completed" : "needsAction"
    };
    await apiCall(`/lists/${activeListId}/tasks/${task.id}`, "PATCH", body);
  } catch (error) {
    console.error("Échec de sauvegarde des sous-tâches (sidepanel) :", error);
  }
}

function handleAddSubtaskClick() {
  const taskId = document.getElementById("edit-id").value;
  const task = allTasks[taskId];
  if (!task) return;

  const inputEl = document.getElementById("new-subtask-title");
  const title = inputEl.value.trim();
  if (!title) return;

  if (!task.subtasks) task.subtasks = [];
  const newSubtask = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    completed: false
  };
  task.subtasks.push(newSubtask);
  inputEl.value = "";

  renderSubtasksList(task);
  saveSubtasksOptimistic(task);
}

function renderSubtasksList(task) {
  const container = document.getElementById("subtasks-container");
  if (!container) return;
  container.innerHTML = "";

  if (!task.subtasks || task.subtasks.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 text-center py-4 bg-white rounded-xl border border-gray-100">Aucune sous-tâche.</p>`;
    return;
  }

  task.subtasks.forEach(sub => {
    const item = document.createElement("div");
    item.className = "flex items-center gap-2.5 mb-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer";
    checkbox.checked = sub.completed;
    checkbox.addEventListener("change", () => {
      sub.completed = checkbox.checked;
      if (sub.completed) {
        input.classList.add("line-through", "text-gray-400", "opacity-60");
      } else {
        input.classList.remove("line-through", "text-gray-400", "opacity-60");
      }
      saveSubtasksOptimistic(task);
    });

    const input = document.createElement("input");
    input.type = "text";
    input.className = "flex-1 border border-transparent rounded-lg px-2 py-1 text-xs outline-none bg-transparent hover:border-gray-150 focus:bg-white focus:border-blue-500 transition-all " + 
      (sub.completed ? "line-through text-gray-400 opacity-60" : "text-gray-700");
    input.value = sub.title;
    input.addEventListener("change", () => {
      sub.title = input.value.trim() || "Sous-tâche";
      saveSubtasksOptimistic(task);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });

    const btnDelete = document.createElement("button");
    btnDelete.className = "p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all shrink-0";
    btnDelete.title = "Supprimer la sous-tâche";
    btnDelete.innerHTML = `
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
      </svg>
    `;
    btnDelete.addEventListener("click", () => {
      task.subtasks = task.subtasks.filter(s => s.id !== sub.id);
      renderSubtasksList(task);
      saveSubtasksOptimistic(task);
    });

    item.appendChild(checkbox);
    item.appendChild(input);
    item.appendChild(btnDelete);
    container.appendChild(item);
  });
}

async function handleArchiveDoneTasks() {
  const doneTasks = Object.values(allTasks).filter(t => t.columnId === "done" && !t.archived);
  if (doneTasks.length === 0) return;

  if (!confirm(`Voulez-vous archiver ces ${doneTasks.length} tâches terminées ? (Elles resteront sauvegardées chez Google mais seront masquées ici)`)) {
    return;
  }

  setSyncStatus("connecting", "Archivage...");

  // Sauvegarder l'état précédent pour rollback
  const rollbackStates = doneTasks.map(t => ({
    id: t.id,
    previousArchived: t.archived
  }));

  // 1. Mise à jour visuelle optimiste immédiate
  doneTasks.forEach(task => {
    task.archived = true;
    const cardEl = document.getElementById(task.id);
    if (cardEl) cardEl.remove();
  });

  updateBadges();

  const cacheKey = `kanban_tasks_cache_${activeListId}`;
  const saveCache = async () => {
    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          timestamp: Date.now(),
          items: Object.values(allTasks)
        }
      });
    } catch (e) {
      console.warn("Échec écriture cache :", e);
    }
  };
  await saveCache();

  // 2. Requêtes réseau en arrière-plan parallèles
  if (!navigator.onLine) {
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }

  const promises = doneTasks.map(async (task) => {
    const rawNotes = serializeTaskNotes(task.desc, {
      columnId: task.columnId, tags: task.tags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl,
      archived: true
    });
    await apiCall(`/lists/${activeListId}/tasks/${task.id}`, "PATCH", { notes: rawNotes });
  });

  try {
    await Promise.all(promises);
    setSyncStatus("connected", "Archivées !");
  } catch (error) {
    console.error("Erreur lors de l'archivage en arrière-plan (sidepanel) :", error);
    rollbackStates.forEach(state => {
      const task = allTasks[state.id];
      if (task) {
        task.archived = state.previousArchived;
      }
    });

    renderTasksFromData(Object.values(allTasks));
    await saveCache();

    alert("Une erreur est survenue lors de l'archivage avec Google Tasks. Certaines tâches ont été restaurées.");
    setSyncStatus("error", "Sync échec");
  }
}

