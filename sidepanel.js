/**
 * sidepanel.js
 * Logiciel d'interaction du Panneau Latéral (Side Panel) Kanban Tasks.
 * Gère la communication OAuth2, les appels REST à Google Tasks, le Drag & Drop
 * et la synchronisation avec Gmail en temps réel, 100% conforme au CSP MV3.
 */

// Les fonctions parseTaskNotes, serializeTaskNotes, isConfigTask sont disponibles globalement via parser.js (chargé avant dans le HTML).

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

  // Panneau d'Édition
  document.getElementById("btn-close-editor").addEventListener("click", closeEditor);
  document.getElementById("btn-save-changes").addEventListener("click", saveChanges);
  document.getElementById("btn-delete-task").addEventListener("click", triggerDeleteTask);

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

  // Drag and Drop programmatique sur les conteneurs de colonnes
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

  // Affichage de l'ID d'extension dans l'assistant
  const displayIdEl = document.getElementById("extension-id-display");
  if (displayIdEl) {
    displayIdEl.innerText = chrome.runtime.id;
  }
}

// --- Authentification & Jeton ---
async function initAuth() {
  setSyncStatus("connecting", "Recherche de jeton...");
  // Récupération de l'état persistant
  const storage = await chrome.storage.local.get(["activeListId"]);
  activeListId = storage.activeListId || null;

  authenticate(false); // Tentative silencieuse d'abord
}

function authenticate(interactive = false) {
  setSyncStatus("connecting", "Authentification...");
  chrome.runtime.sendMessage({ type: "GET_TASKS_TOKEN", interactive }, (response) => {
    if (response && response.success && response.token) {
      authToken = response.token;
      document.getElementById("setup-wizard").classList.add("hidden");
      document.getElementById("btn-logout").classList.remove("hidden");
      setSyncStatus("connected", "Connecté");
      loadBoards();
    } else {
      authToken = null;
      document.getElementById("setup-wizard").classList.remove("hidden");
      document.getElementById("btn-logout").classList.add("hidden");
      setSyncStatus("offline", "Non authentifié");
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
    
    // Vider l'affichage
    const boardSelect = document.getElementById("board-select");
    boardSelect.innerHTML = '<option value="" disabled selected>Veuillez vous connecter</option>';
    clearColumns();
  });
}

// --- Gestion de l'état de synchronisation visuel ---
function setSyncStatus(state, text) {
  const dot = document.getElementById("sync-dot");
  const label = document.getElementById("sync-text");
  
  label.innerText = text;
  
  // Couleurs M3 harmonisées
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
      // Jeton expiré
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
  try {
    setSyncStatus("connecting", "Synchro listes...");
    const data = await apiCall("/users/@me/lists");
    
    const boardSelect = document.getElementById("board-select");
    boardSelect.innerHTML = "";

    if (data.items && data.items.length > 0) {
      data.items.forEach(list => {
        const option = document.createElement("option");
        option.value = list.id;
        option.innerText = list.title;
        boardSelect.appendChild(option);
      });

      // Rétablir la liste sélectionnée précédemment
      if (activeListId && Array.from(boardSelect.options).some(opt => opt.value === activeListId)) {
        boardSelect.value = activeListId;
      } else {
        activeListId = data.items[0].id;
        boardSelect.value = activeListId;
        chrome.storage.local.set({ activeListId });
      }

      loadTasks(activeListId);
    } else {
      boardSelect.innerHTML = '<option value="" disabled>Aucun tableau trouvé</option>';
      setSyncStatus("connected", "Vide");
    }
  } catch (error) {
    setSyncStatus("error", "Erreur listes");
  }
}

// --- Chargement et Rendu des Tâches ---
async function loadTasks(listId) {
  if (!listId) return;
  
  clearColumns();
  toggleSkeletons(true);
  setSyncStatus("connecting", "Chargement tâches...");

  try {
    // Récupère toutes les tâches (actives et complétées pour la colonne Terminé)
    const data = await apiCall(`/lists/${listId}/tasks?showCompleted=true&showHidden=true`);
    toggleSkeletons(false);

    allTasks = {};
    const taskItems = data.items || [];

    taskItems.forEach(rawTask => {
      // Filtrer les tâches de configuration interne
      if (isConfigTask(rawTask)) return;

      const { description, metadata } = parseTaskNotes(rawTask.notes);
      
      // Détermination finale de la colonne
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
        completed: rawTask.status === "completed"
      };

      allTasks[task.id] = task;
      renderTaskCard(task);
    });

    updateBadges();
    setSyncStatus("connected", "À jour");
  } catch (error) {
    toggleSkeletons(false);
    setSyncStatus("error", "Erreur tâches");
  }
}

// --- Rendu des cartes dans le DOM ---
function renderTaskCard(task) {
  const targetCol = cols[task.columnId];
  if (!targetCol) return;

  const card = document.createElement("div");
  card.id = task.id;
  card.draggable = true;
  card.className = "bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group card-transition";
  
  // 1. Tags
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

  // 2. Titre et description
  const titleClass = task.completed 
    ? "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]" 
    : "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
  
  const descHtml = task.desc 
    ? `<p class="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">${escapeHtml(task.desc)}</p>` 
    : "";

  // 3. Pied de carte (date + contexte gmail)
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

  card.innerHTML = `
    ${tagsHtml}
    <h4 class="${titleClass}">${escapeHtml(task.title)}</h4>
    ${descHtml}
    ${footerHtml}
  `;

  // Événements du Drag & Drop natif sur la carte
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
    
    // Effet visuel immédiat
    setTimeout(() => {
      card.classList.add("opacity-40");
      card.style.transform = "scale(0.96) rotate(-2deg)";
    }, 0);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("opacity-40");
    card.style.transform = "";
  });

  // Clic pour ouvrir l'éditeur de détails
  card.addEventListener("click", () => openEditor(task.id));

  targetCol.appendChild(card);
}

// --- Drag & Drop Persistance dans l'API ---
async function handleTaskColumnMove(taskId, columnId) {
  const task = allTasks[taskId];
  if (!task) return;

  const previousColumn = task.columnId;
  task.columnId = columnId;

  // Si on déplace vers Terminé, on marque complété
  const makeCompleted = (columnId === "done");
  task.completed = makeCompleted;

  setSyncStatus("connecting", "Enregistrement...");

  try {
    const rawNotes = serializeTaskNotes(task.desc, {
      columnId,
      tags: task.tags,
      subtasks: task.subtasks,
      gmailId: task.gmailId,
      gmailSubject: task.gmailSubject,
      gmailUrl: task.gmailUrl
    });

    const body = {
      notes: rawNotes,
      status: makeCompleted ? "completed" : "needsAction"
    };

    // Si on uncomplete la tâche, on doit effacer la date complétée de Google Tasks
    if (!makeCompleted) {
      body.completed = null;
    }

    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);
    
    // Mettre à jour l'affichage de la carte (changement de couleur de titre si complété)
    const card = document.getElementById(taskId);
    if (card) {
      const h4 = card.querySelector("h4");
      if (makeCompleted) {
        h4.className = "font-semibold text-xs text-gray-400 line-through group-hover:text-[#0b57d0]";
      } else {
        h4.className = "font-semibold text-xs text-gray-800 group-hover:text-[#0b57d0]";
      }
    }

    setSyncStatus("connected", "Déplacé !");
  } catch (error) {
    // Rétablir la colonne locale en cas d'échec
    task.columnId = previousColumn;
    task.completed = (previousColumn === "done");
    loadTasks(activeListId);
    setSyncStatus("error", "Sync échec");
  }
}

// --- Ajout d'une nouvelle tâche ---
async function triggerAddNewTask(columnId) {
  const cardId = `card-temp-${Date.now()}`;
  
  // Valeurs par défaut pour la création
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
    
    // Remplacement local et rendu de la vraie tâche retournée
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
    
    // Ouvrir immédiatement l'éditeur sur la nouvelle tâche
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

  const newTitle = document.getElementById("edit-title").value.trim() || "Sans titre";
  const newDesc = document.getElementById("edit-desc").value;
  const newDate = document.getElementById("edit-date").value;
  const newColumnId = document.getElementById("edit-status").value;
  
  // Parsing simple des tags
  const tagsInput = document.getElementById("edit-tags").value;
  const newTags = tagsInput 
    ? tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0) 
    : [];

  const previousColumn = task.columnId;
  const makeCompleted = (newColumnId === "done");

  setSyncStatus("connecting", "Sauvegarde...");

  try {
    const rawNotes = serializeTaskNotes(newDesc, {
      columnId: newColumnId,
      tags: newTags,
      subtasks: task.subtasks,
      gmailId: task.gmailId,
      gmailSubject: task.gmailSubject,
      gmailUrl: task.gmailUrl
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

    const updatedRawTask = await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);

    // Mettre à jour l'objet local
    task.title = newTitle;
    task.desc = newDesc;
    task.date = newDate;
    task.displayDate = newDate ? formatDateFriendly(newDate) : "";
    task.columnId = newColumnId;
    task.tags = newTags;
    task.completed = makeCompleted;

    // Retirer l'élément actuel du DOM et le restituer mis à jour
    const cardEl = document.getElementById(taskId);
    if (cardEl) cardEl.remove();
    
    renderTaskCard(task);
    updateBadges();
    
    // Si la colonne a changé, on applique l'effet
    closeEditor();
    setSyncStatus("connected", "Modifiée !");
  } catch (error) {
    setSyncStatus("error", "Sync échec");
  }
}

async function triggerDeleteTask() {
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
  
  subjectEl.innerText = emailData.title;
  
  toast.classList.remove("translate-y-24", "opacity-0", "pointer-events-none");
  toast.classList.add("translate-y-0", "opacity-100");
}

function hideGmailToast() {
  const toast = document.getElementById("gmail-toast");
  toast.classList.add("translate-y-24", "opacity-0", "pointer-events-none");
  toast.classList.remove("translate-y-0", "opacity-100");
  chrome.storage.local.remove("lastCapturedEmail").catch(() => {});
}

async function openEditorWithCapturedEmail() {
  if (!capturedEmail) return;

  // Création automatique de la tâche Kanban liée à l'e-mail
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
    
    // Ouvre le panneau d'édition sur cette tâche fraîchement créée pour laisser l'utilisateur ajuster
    openEditor(task.id);
    setSyncStatus("connected", "Lié !");
  } catch (error) {
    setSyncStatus("error", "Échec liaison");
  }

  capturedEmail = null;
}

// Vérifie si un e-mail a été stocké par background.js au chargement de l'onglet plein écran
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

// --- Vue Smart : Objectif Travail ---
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
  
  todayContainer.innerHTML = "";
  weekContainer.innerHTML = "";

  const todayStr = getLocalDateString(new Date());
  
  // Date de fin de semaine (dans 7 jours)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = getLocalDateString(nextWeek);

  let todayCount = 0;
  let weekCount = 0;

  Object.values(allTasks).forEach(task => {
    if (task.completed) return; // Ne pas afficher les tâches terminées dans Objectif Travail
    if (!task.date) return; // Pas de date de planification

    const taskDateStr = task.date; // Format YYYY-MM-DD

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
  // Rendu de la carte sans drag listener ni effets interactifs complexes pour la Smart View
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
    <div class="flex items-center justify-between text-[10px] text-gray-450 pt-2.5 border-t border-gray-50 mt-3">
      <span class="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">${task.displayDate}</span>
      <span class="text-gray-400 uppercase tracking-widest font-extrabold text-[8px]">${task.columnId === "inprogress" ? "En cours" : "À faire"}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    switchTab("kanban");
    // Petit délai pour laisser le tab transiter puis ouvrir l'éditeur
    setTimeout(() => openEditor(task.id), 150);
  });

  container.appendChild(card);
}

// --- Utilitaires de Nettoyage et Helpers ---
function clearColumns() {
  Object.values(cols).forEach(col => col.innerHTML = "");
}

function toggleSkeletons(show) {
  Object.values(skeletons).forEach(skeleton => {
    if (show) skeleton.classList.remove("hidden");
    else skeleton.classList.add("hidden");
  });
}

function updateBadges() {
  Object.keys(cols).forEach(colId => {
    badges[colId].innerText = cols[colId].children.length;
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
