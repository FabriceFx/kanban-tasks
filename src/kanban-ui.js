/**
 * src/kanban-ui.js
 * Module de gestion de l'interface visuelle du Kanban (Shadow DOM).
 * Encapsule le template, le rendu des colonnes, le glisser-déposer,
 * les fenêtres de toast, l'éditeur de détails et le cache local.
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

// ============================================================================
// ÉTAT GLOBAL DE L'APPLICATION KANBAN (Partagé dans ce module)
// ============================================================================
export let isKanbanActive = false;
export let kanbanShadowRoot = null;
let kanbanInitialized = false;
let originalDisplayStates = new Map();

let authToken = null;
export let activeListId = null;
export let allTasks = {};
let capturedEmail = null;

const GMAIL_SUBJECT_SELECTOR = "h2.hP";

// ============================================================================
// TEMPLATE HTML DU KANBAN
// ============================================================================
function getKanbanHTML() {
  return `
  <div class="kanban-root">
    <!-- EN-TÊTE -->
    <header class="kanban-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="logo-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
            </svg>
          </div>
          <select id="board-select" class="board-select">
            <option value="" disabled selected data-i18n="loading">Chargement...</option>
          </select>
        </div>
        <div class="header-actions">
          <div id="sync-status" class="sync-badge">
            <span class="sync-dot" id="sync-dot"></span>
            <span id="sync-text" data-i18n="syncing">Synchro...</span>
          </div>
          <button id="btn-logout" class="btn-icon danger hidden" title="Se déconnecter" data-i18n-title="logout">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
          <button id="btn-fullscreen" class="btn-icon" title="Ouvrir dans un nouvel onglet" data-i18n-title="open_new_tab">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tab-switcher">
        <button id="tab-kanban" class="tab-btn active" data-i18n="tab_kanban">Tableau Kanban</button>
        <button id="tab-smart" class="tab-btn" data-i18n="tab_smart">Objectifs du jour</button>
      </div>
    </header>

    <!-- ZONE PRINCIPALE -->
    <main class="kanban-main">

      <!-- SETUP WIZARD (masqué par défaut) -->
      <div id="setup-wizard" class="setup-wizard hidden">
        <div class="wizard-content">
          <div>
            <div class="wizard-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
            </div>
            <h2 class="wizard-title" data-i18n="setup_title">Accès à vos tâches Google</h2>
            <p class="wizard-desc" data-i18n="setup_desc">Visualisez et gérez vos tâches Google Tasks dans un tableau Kanban intuitif et fluide directement intégré.</p>
          </div>
 
          <div>
            <button id="btn-login" class="btn-google">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span data-i18n="login_google">Se connecter avec Google</span>
            </button>
            <p class="wizard-footer-text" style="margin-top: 12px;" data-i18n="setup_footer">Vos données de tâches transitent uniquement entre Chrome et les serveurs sécurisés de Google.</p>
          </div>

          <div id="auth-error-display" class="auth-error-display"></div>
        </div>
      </div>

      <!-- TOAST GMAIL -->
      <div id="gmail-toast" class="gmail-toast">
        <div class="toast-header">
          <div class="toast-badge">
            <div class="toast-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span class="toast-label" data-i18n="toast_email_opened">E-mail ouvert</span>
          </div>
          <button id="btn-close-toast" class="btn-close-toast">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p id="gmail-toast-subject" class="toast-subject"></p>
        <button id="btn-add-gmail-task" class="btn-toast-add" data-i18n="gmail_toast_btn_create">Créer une tâche Kanban</button>
      </div>

      <!-- VUE KANBAN -->
      <div id="view-kanban" class="view-kanban">
        <!-- Colonne À FAIRE -->
        <div id="col-todo-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_todo">À faire</span>
            <span id="badge-todo" class="column-badge badge-todo">0</span>
          </div>
          <div id="skeleton-todo" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-25"></div>
              <div class="skeleton-line w-75"></div>
              <div class="skeleton-line w-85"></div>
            </div>
          </div>
          <div id="col-todo" class="card-list"></div>
          <button id="btn-add-todo" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une tâche</span>
          </button>
        </div>

        <!-- Colonne EN COURS -->
        <div id="col-inprogress-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_in_progress">En cours</span>
            <span id="badge-inprogress" class="column-badge badge-inprogress">0</span>
          </div>
          <div id="skeleton-inprogress" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-33"></div>
              <div class="skeleton-line w-85"></div>
            </div>
          </div>
          <div id="col-inprogress" class="card-list"></div>
          <button id="btn-add-inprogress" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une tâche</span>
          </button>
        </div>

        <!-- Colonne TERMINÉ -->
        <div id="col-done-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title" data-i18n="col_done">Terminé</span>
            <div class="flex items-center gap-2">
              <button id="btn-archive-done" class="column-badge" style="color: #1a7f37; border-color: rgba(26,127,55,0.2); background-color: #e6f4ea; cursor: pointer; display: none;" data-i18n="btn_archive" title="Archiver toutes les tâches terminées">Archiver</button>
              <span id="badge-done" class="column-badge badge-done">0</span>
            </div>
          </div>
          <div id="skeleton-done" class="skeleton hidden">
            <div class="skeleton-card">
              <div class="skeleton-line w-25"></div>
            </div>
          </div>
          <div id="col-done" class="card-list"></div>
          <button id="btn-add-done" class="btn-add-task">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span data-i18n="btn_add_task">Ajouter une tâche</span>
          </button>
        </div>
      </div>

      <!-- VUE SMART -->
      <div id="view-smart" class="view-smart hidden">
        <div>
          <h2 class="smart-section-title today">
            <span class="smart-dot today"></span> <span data-i18n="smart_today">Aujourd'hui</span>
          </h2>
          <div id="smart-today">
            <p class="smart-empty" data-i18n="smart_no_tasks">Aucune tâche planifiée pour aujourd'hui.</p>
          </div>
        </div>
        <div>
          <h2 class="smart-section-title week">
            <span class="smart-dot week"></span> <span data-i18n="smart_week">Cette semaine</span>
          </h2>
          <div id="smart-week">
            <p class="smart-empty" data-i18n="smart_no_tasks">Aucune tâche planifiée pour cette semaine.</p>
          </div>
        </div>
      </div>

      <!-- PANNEAU D'ÉDITION -->
      <div id="editor-panel" class="editor-overlay hidden">
        <div class="editor-panel">
          <div class="editor-header">
            <h3 data-i18n="editor_details_title">Détails de la tâche</h3>
            <button id="btn-close-editor" class="btn-close-editor" data-i18n="btn_cancel">Fermer</button>
          </div>
          <div class="editor-body">
            <input type="hidden" id="edit-id">
            <div>
              <label class="form-label" data-i18n="editor_title_label">Titre</label>
              <input type="text" id="edit-title" class="form-input" placeholder="Nommez votre tâche..." data-i18n-placeholder="editor_title_placeholder">
            </div>
            <div>
              <label class="form-label" data-i18n="editor_desc_label">Description</label>
              <textarea id="edit-desc" rows="4" class="form-textarea" placeholder="Rédigez des détails ou consignes..." data-i18n-placeholder="editor_desc_placeholder"></textarea>
            </div>
            <div class="form-row">
              <div>
                <label class="form-label" data-i18n="editor_date_label">Échéance</label>
                <input type="date" id="edit-date" class="form-input">
              </div>
              <div>
                <label class="form-label" data-i18n="editor_status_label">Statut</label>
                <select id="edit-status" class="form-select">
                  <option value="todo" data-i18n="col_todo">À faire</option>
                  <option value="inprogress" data-i18n="col_in_progress">En cours</option>
                  <option value="done" data-i18n="col_done">Terminé</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label" data-i18n="editor_tags_label">Étiquettes (séparées par virgules)</label>
              <input type="text" id="edit-tags" class="form-input" placeholder="ex: Urgent, Projet client" data-i18n-placeholder="editor_tags_placeholder">
            </div>
            <div class="subtasks-section" id="subtasks-section">
              <label class="form-label" data-i18n="editor_subtasks_label">Sous-tâches</label>
              <div id="subtasks-container"></div>
              <div class="flex gap-2" style="margin-top: 12px;">
                <input type="text" id="new-subtask-title" class="form-input" placeholder="Ajouter une sous-tâche..." style="flex: 1;" data-i18n-placeholder="editor_new_subtask_placeholder">
                <button id="btn-add-subtask" class="btn-save" style="width: auto; padding: 8px 16px; border-radius: 8px; flex-shrink: 0; font-size: 11px;" data-i18n="btn_add" disabled>Ajouter</button>
              </div>
            </div>
            <div id="gmail-context" class="gmail-context hidden">
              <div class="gmail-context-header">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="gmail-context-label" data-i18n="editor_gmail_context_label">E-mail Gmail d'origine</span>
              </div>
              <p id="gmail-subject" class="gmail-context-subject"></p>
              <a id="gmail-link" href="#" target="_blank" class="gmail-context-link">
                <span data-i18n="editor_view_gmail_link">Consulter l'e-mail dans Gmail</span>
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
                </svg>
              </a>
            </div>
          </div>
          <div class="editor-footer">
            <button id="btn-delete-task" class="btn-delete" title="Supprimer la tâche" data-i18n-title="btn_delete_task">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <button id="btn-save-changes" class="btn-save" data-i18n="editor_btn_save">Enregistrer les modifications</button>
          </div>
        </div>
      </div>

    </main>
  </div>
  `;
}

/** Accès rapide aux sélecteurs du Shadow DOM */
export function $(id) {
  return kanbanShadowRoot ? kanbanShadowRoot.getElementById(id) : null;
}

// ============================================================================
// COMMUNICATION API REST GOOGLE TASKS
// ============================================================================
async function apiCall(endpoint, method = "GET", body = null) {
  if (!authToken) {
    authenticate(false);
    throw new Error("Authentification requise.");
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: "API_PROXY",
      endpoint,
      method,
      body,
      token: authToken
    }, (response) => {
      if (chrome.runtime.lastError) {
        setSyncStatus("error", "Erreur comm.");
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response || !response.success) {
        if (response && response.status === 401) {
          logout();
          reject(new Error("Jeton expiré. Veuillez vous reconnecter."));
          return;
        }
        setSyncStatus("error", "Erreur Sync");
        reject(new Error(response ? response.error : "Pas de réponse"));
        return;
      }
      resolve(response.data);
    });
  });
}

// ============================================================================
// COMPORTEMENT DES BOARDS & BOUTONS SIDEBAR
// ============================================================================
import { updateSidebarButtonStyle } from "./dom-injector.js";

export function showKanban() {
  isKanbanActive = true;
  const mainPane = document.querySelector("div[role='main']");
  if (!mainPane) return;

  mainPane.style.position = "relative";

  // Masquer les enfants existants de Gmail
  Array.from(mainPane.children).forEach(child => {
    if (child.id !== "gmail-kanban-embed") {
      if (!originalDisplayStates.has(child)) {
        originalDisplayStates.set(child, child.style.display || "");
      }
      child.style.display = "none";
    }
  });

  // Créer ou afficher le conteneur Shadow DOM
  let embedContainer = document.getElementById("gmail-kanban-embed");
  if (!embedContainer) {
    embedContainer = document.createElement("div");
    embedContainer.id = "gmail-kanban-embed";
    Object.assign(embedContainer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "9999",
      borderRadius: "16px",
      overflow: "hidden",
      display: "block"
    });

    kanbanShadowRoot = embedContainer.attachShadow({ mode: "open" });

    // Charger le CSS autonome
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = chrome.runtime.getURL("kanban-embed.css");
    kanbanShadowRoot.appendChild(linkEl);

    // Injecter le template HTML
    const wrapper = document.createElement("div");
    wrapper.innerHTML = getKanbanHTML();
    kanbanShadowRoot.appendChild(wrapper.firstElementChild);
    localizeDOM(kanbanShadowRoot);

    mainPane.appendChild(embedContainer);

    // Initialiser une fois le CSS chargé
    linkEl.addEventListener("load", () => {
      if (!kanbanInitialized) {
        kanbanInitialized = true;
        initKanbanApp();
      }
    });
    setTimeout(() => {
      if (!kanbanInitialized) {
        kanbanInitialized = true;
        initKanbanApp();
      }
    }, 500);
  } else {
    if (embedContainer.parentNode !== mainPane) {
      mainPane.appendChild(embedContainer);
    }
    embedContainer.style.display = "block";
    // Rafraîchir les tâches si déjà initialisé
    if (kanbanInitialized && activeListId) {
      loadTasks(activeListId);
    }
  }

  updateSidebarButtonStyle();
}

export function hideKanban() {
  isKanbanActive = false;
  const embedContainer = document.getElementById("gmail-kanban-embed");
  if (embedContainer) {
    embedContainer.style.display = "none";
  }

  // Restaurer le display d'origine des éléments Gmail
  originalDisplayStates.forEach((display, child) => {
    if (child && child.parentElement) {
      child.style.display = display;
    }
  });
  originalDisplayStates.clear();

  updateSidebarButtonStyle();
}

export function syncKanbanVisibility() {
  if (!isKanbanActive) return;
  const mainPane = document.querySelector("div[role='main']");
  if (!mainPane) return;

  Array.from(mainPane.children).forEach(child => {
    if (child.id !== "gmail-kanban-embed") {
      if (!originalDisplayStates.has(child)) {
        originalDisplayStates.set(child, child.style.display || "");
      }
      if (child.style.display !== "none") {
        child.style.display = "none";
      }
    }
  });
}

// ============================================================================
// INITIALISATION DE L'APPLICATION DANS LE SHADOW DOM
// ============================================================================
export function initKanbanApp() {
  setupKanbanEventListeners();
  initAuth();
  checkLastCapturedEmail();
}

function setupKanbanEventListeners() {
  // Onglets
  $("tab-kanban")?.addEventListener("click", () => switchTab("kanban"));
  $("tab-smart")?.addEventListener("click", () => switchTab("smart"));

  // Sélecteur de board
  $("board-select")?.addEventListener("change", (e) => {
    activeListId = e.target.value;
    chrome.storage.local.set({ activeListId });
    loadTasks(activeListId);
  });

  // Boutons d'ajout rapide
  $("btn-add-todo")?.addEventListener("click", () => triggerAddNewTask("todo"));
  $("btn-add-inprogress")?.addEventListener("click", () => triggerAddNewTask("inprogress"));
  $("btn-add-done")?.addEventListener("click", () => triggerAddNewTask("done"));
  $("btn-archive-done")?.addEventListener("click", handleArchiveDoneTasks);

  // Éditeur
  $("btn-close-editor")?.addEventListener("click", closeEditor);
  $("btn-save-changes")?.addEventListener("click", saveChanges);
  $("btn-delete-task")?.addEventListener("click", triggerDeleteTask);
  $("btn-add-subtask")?.addEventListener("click", handleAddSubtaskClick);
  $("new-subtask-title")?.addEventListener("input", () => {
    const btn = $("btn-add-subtask");
    if (btn) btn.disabled = !$("new-subtask-title").value.trim();
  });
  $("new-subtask-title")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtaskClick();
    }
  });

  // Auth
  $("btn-login")?.addEventListener("click", () => authenticate(true));
  $("btn-logout")?.addEventListener("click", logout);

  // Plein écran (nouvel onglet)
  $("btn-fullscreen")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_FULLSCREEN" });
  });

  // Toast Gmail
  $("btn-close-toast")?.addEventListener("click", hideGmailToast);
  $("btn-add-gmail-task")?.addEventListener("click", openEditorWithCapturedEmail);

  // Drag & Drop sur les conteneurs de colonnes
  ["todo", "inprogress", "done"].forEach(columnId => {
    const container = $(`col-${columnId}-container`);
    container?.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.classList.add("drag-over-active");
    });
    container?.addEventListener("dragleave", () => {
      container.classList.remove("drag-over-active");
    });
    container?.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-over-active");
      const cardId = e.dataTransfer.getData("text/plain");
      const cardElement = kanbanShadowRoot.getElementById(cardId);
      const targetList = $(`col-${columnId}`);
      if (cardElement && targetList && cardElement.parentElement !== targetList) {
        targetList.appendChild(cardElement);
        updateBadges();
        handleTaskColumnMove(cardId, columnId);
      }
    });
  });

  // Écoute des messages venant de background.js
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
            console.log("[Kanban] Mise à jour en temps réel détectée depuis le cache");
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

  // Affichage de l'ID d'extension
  const displayIdEl = $("extension-id-display");
  if (displayIdEl) displayIdEl.innerText = chrome.runtime.id;
}

// --- Auth ---
async function initAuth() {
  setSyncStatus("connecting", "Recherche de jeton...");
  const storage = await chrome.storage.local.get(["activeListId"]);
  activeListId = storage.activeListId || null;
  authenticate(false);
}

function authenticate(interactive = false) {
  setSyncStatus("connecting", "Authentification...");
  const errorEl = $("auth-error-display");
  if (errorEl) {
    errorEl.classList.remove("visible");
    errorEl.innerHTML = "";
  }

  chrome.runtime.sendMessage({ type: "GET_TASKS_TOKEN", interactive }, (response) => {
    const errorEl = $("auth-error-display");
    if (chrome.runtime.lastError) {
      console.error("[Kanban] Erreur de communication avec l'extension :", chrome.runtime.lastError);
      authToken = null;
      const setupWizard = $("setup-wizard");
      if (setupWizard) setupWizard.classList.remove("hidden");
      const btnLogout = $("btn-logout");
      if (btnLogout) btnLogout.classList.add("hidden");
      setSyncStatus("offline", "Erreur extension");
      
      const boardSelect = $("board-select");
      if (boardSelect) {
        boardSelect.innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
      }
      
      if (errorEl) {
        errorEl.innerHTML = `<strong>Erreur de communication :</strong><br>Impossible de se connecter au service worker de l'extension.<br><span style="font-size: 9px; margin-top: 4px; display: block;">Essayez de recharger la page Gmail. (${chrome.runtime.lastError.message})</span>`;
        errorEl.classList.add("visible");
      }
      return;
    }
    if (response && response.success && response.token) {
      authToken = response.token;
      const setupWizard = $("setup-wizard");
      if (setupWizard) setupWizard.classList.add("hidden");
      const btnLogout = $("btn-logout");
      if (btnLogout) btnLogout.classList.remove("hidden");
      setSyncStatus("connected", "Connecté");
      loadBoards();
    } else {
      authToken = null;
      const setupWizard = $("setup-wizard");
      if (setupWizard) setupWizard.classList.remove("hidden");
      const btnLogout = $("btn-logout");
      if (btnLogout) btnLogout.classList.add("hidden");
      setSyncStatus("offline", "Non authentifié");
      
      const boardSelect = $("board-select");
      if (boardSelect) {
        boardSelect.innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
      }

      const errMsg = response && response.error ? response.error : "Échec d'authentification";
      if (interactive) {
        console.error("[Kanban] Échec de l'authentification (Shadow DOM) :", errMsg);
        if (errorEl) {
          if (errMsg.includes("OAuth2 client not found") || errMsg.includes("OAuth2")) {
            errorEl.innerHTML = `<strong>Erreur de configuration Google Cloud :</strong><br>Le client_id dans manifest.json n'est pas associé à l'ID d'extension <code>${chrome.runtime.id}</code>.<br><span style="font-size: 9px; margin-top: 4px; display: block;">Dépliez la section ci-dessous pour l'associer.</span>`;
          } else {
            errorEl.innerText = `Erreur : ${errMsg}`;
          }
          errorEl.classList.add("visible");
        }
      }
    }
  });
}

function logout() {
  if (!authToken) return;
  chrome.runtime.sendMessage({ type: "LOGOUT_USER", token: authToken }, () => {
    authToken = null;
    $("setup-wizard").classList.remove("hidden");
    $("btn-logout").classList.add("hidden");
    setSyncStatus("offline", "Déconnecté");
    $("board-select").innerHTML = `<option value="" disabled selected>${getMessage("setup_wizard_placeholder_login", "Veuillez vous connecter")}</option>`;
    clearColumns();
  });
}

// --- Sync Status ---
export function setSyncStatus(state, text) {
  const dot = $("sync-dot");
  const label = $("sync-text");
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
  dot.className = "sync-dot " + state;
}

// --- Chargement des Boards ---
async function loadBoards() {
  setSyncStatus("connecting", "Synchro listes...");
  
  try {
    const cache = await chrome.storage.local.get("kanban_lists_cache");
    const cachedData = cache.kanban_lists_cache;
    
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      console.log("[Kanban] Utilisation du cache pour les listes");
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
    console.error("[Kanban] Erreur réseau lors de la récupération des listes :", error);
    try {
      const cache = await chrome.storage.local.get("kanban_lists_cache");
      const cachedData = cache.kanban_lists_cache;
      if (cachedData && cachedData.items) {
        console.log("[Kanban] Fallback hors-ligne sur cache expiré pour les listes");
        renderBoards(cachedData.items, true);
        return;
      }
    } catch (e) {}
    
    setSyncStatus("error", "Erreur réseau");
    const boardSelect = $("board-select");
    if (boardSelect) boardSelect.innerHTML = '<option value="" disabled>Erreur de connexion</option>';
  }
}

function renderBoards(items, isOffline = false) {
  const boardSelect = $("board-select");
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

// --- Chargement des Tâches ---
export async function loadTasks(listId) {
  if (!listId) return;
  clearColumns();
  toggleSkeletons(true);
  setSyncStatus("connecting", "Chargement tâches...");

  const cacheKey = `kanban_tasks_cache_${listId}`;
  
  try {
    const cache = await chrome.storage.local.get(cacheKey);
    const cachedData = cache[cacheKey];
    
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      console.log("[Kanban] Utilisation du cache pour les tâches de", listId);
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
    
    const taskItems = (data && data.items) || [];
    const formattedTasks = [];

    taskItems.forEach(rawTask => {
      if (isConfigTask(rawTask)) return;
      const { description, metadata } = parseTaskNotes(rawTask.notes);
      if (metadata.archived === true) return;

      let columnId = metadata.columnId || "todo";
      if (rawTask.status === "completed") columnId = "done";

      const task = {
        id: rawTask.id, title: rawTask.title, desc: description,
        date: rawTask.due ? formatDateForInput(rawTask.due) : "",
        displayDate: rawTask.due ? formatDateFriendly(rawTask.due) : "",
        tags: metadata.tags || [], subtasks: metadata.subtasks || [],
        gmailId: metadata.gmailId, gmailSubject: metadata.gmailSubject,
        gmailUrl: metadata.gmailUrl, columnId,
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
        console.log("[Kanban] Fallback hors-ligne sur cache expiré pour les tâches");
        renderTasksFromData(cachedData.items);
        setSyncStatus("offline", "Hors-ligne (Cache)");
        return;
      }
    } catch (e) {}

    setSyncStatus("error", "Erreur réseau");
  }
}

export function renderTasksFromData(tasks) {
  clearColumns();
  allTasks = {};
  tasks.forEach(task => {
    if (task.archived === true) return;
    allTasks[task.id] = task;
    renderTaskCard(task);
  });
  updateBadges();
}

// --- Rendu des Cartes ---
function renderTaskCard(task) {
  const targetCol = $(`col-${task.columnId}`);
  if (!targetCol) return;

  const card = document.createElement("div");
  card.id = task.id;
  card.draggable = true;
  card.className = "task-card";

  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="card-tags">`;
    task.tags.forEach(tag => {
      const cls = tag.toLowerCase() === "urgent" ? "tag tag-urgent" : "tag tag-default";
      tagsHtml += `<span class="${cls}">${escapeHtml(tag)}</span>`;
    });
    tagsHtml += `</div>`;
  }

  const titleClass = task.completed ? "card-title completed" : "card-title";
  const descHtml = task.desc ? `<p class="card-desc">${escapeHtml(task.desc)}</p>` : "";

  let footerHtml = "";
  if (task.displayDate || task.gmailUrl) {
    footerHtml = `<div class="card-footer">`;
    if (task.displayDate) {
      footerHtml += `<span class="card-date">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
        </svg>
        ${task.displayDate}
      </span>`;
    } else {
      footerHtml += `<span></span>`;
    }
    if (task.gmailUrl) {
      footerHtml += `<span class="card-gmail-badge">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
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
      <div class="card-subtasks">
        <div class="subtasks-text">
          <svg class="subtask-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${completedCount}/${totalCount} ${getMessage("subtasks_progression", "sous-tâches")}</span>
        </div>
        <div class="subtasks-progress-bar">
          <div class="subtasks-progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }

  card.innerHTML = `${tagsHtml}<h4 class="${titleClass}">${escapeHtml(task.title)}</h4>${descHtml}${subtasksHtml}${footerHtml}`;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => card.classList.add("dragging"), 0);
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  card.addEventListener("click", () => openEditor(task.id));

  targetCol.appendChild(card);
}

// --- Drag & Drop Persistance ---
async function handleTaskColumnMove(taskId, columnId) {
  const task = allTasks[taskId];
  if (!task) return;
  const previousColumn = task.columnId;
  const previousCompleted = task.completed;

  if (!navigator.onLine) {
    alert("Impossible de modifier la tâche en mode hors-ligne. Veuillez rétablir votre connexion internet.");
    const cardEl = kanbanShadowRoot.getElementById(taskId);
    if (cardEl) {
      const targetCol = $(`col-${previousColumn}`);
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
  const cardEl = kanbanShadowRoot.getElementById(taskId);
  if (cardEl) {
    const h4 = cardEl.querySelector("h4");
    if (h4) {
      h4.className = makeCompleted ? "card-title completed" : "card-title";
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
      columnId, tags: task.tags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl,
      archived: task.archived || false
    });
    const body = { notes: rawNotes, status: makeCompleted ? "completed" : "needsAction" };
    if (!makeCompleted) body.completed = null;
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);

    setSyncStatus("connected", "Déplacé !");
  } catch (error) {
    console.error("Échec de déplacement de colonne :", error);
    // 3. Rollback
    task.columnId = previousColumn;
    task.completed = previousCompleted;

    if (cardEl) {
      const targetCol = $(`col-${previousColumn}`);
      if (targetCol) {
        targetCol.appendChild(cardEl);
        const h4 = cardEl.querySelector("h4");
        if (h4) {
          h4.className = previousCompleted ? "card-title completed" : "card-title";
        }
      }
    }
    updateBadges();
    await saveCache();

    alert("Échec de la synchronisation avec Google Tasks. La tâche a été replacée à sa position d'origine.");
    setSyncStatus("error", "Sync échec");
  }
}

// --- Ajout de tâche ---
async function triggerAddNewTask(columnId) {
  if (!navigator.onLine) {
    alert("Impossible d'ajouter une tâche en mode hors-ligne.");
    setSyncStatus("offline", "Hors-ligne (Cache)");
    return;
  }
  
  setSyncStatus("connecting", "Création tâche...");
  try {
    const rawNotes = serializeTaskNotes("", { columnId, tags: [], subtasks: [] });
    const body = {
      title: "Nouvelle tâche", notes: rawNotes,
      status: columnId === "done" ? "completed" : "needsAction"
    };
    const createdRawTask = await apiCall(`/lists/${activeListId}/tasks`, "POST", body);
    const task = {
      id: createdRawTask.id, title: createdRawTask.title, desc: "",
      date: "", displayDate: "", tags: [], subtasks: [],
      columnId, completed: columnId === "done"
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

// --- Éditeur ---
function openEditor(taskId) {
  const task = allTasks[taskId];
  if (!task) return;
  $("edit-id").value = taskId;
  $("edit-title").value = task.title;
  $("edit-desc").value = task.desc;
  $("edit-date").value = task.date;
  $("edit-status").value = task.columnId;
  $("edit-tags").value = task.tags.join(", ");
  $("new-subtask-title").value = "";
  const addBtn = $("btn-add-subtask");
  if (addBtn) addBtn.disabled = true;
  renderSubtasksList(task);

  const gmailContext = $("gmail-context");
  if (task.gmailUrl) {
    gmailContext.classList.remove("hidden");
    $("gmail-subject").innerText = task.gmailSubject;
    $("gmail-link").href = task.gmailUrl;
  } else {
    gmailContext.classList.add("hidden");
  }
  $("editor-panel").classList.remove("hidden");
}

function closeEditor() {
  $("editor-panel").classList.add("hidden");
}

async function saveChanges() {
  const taskId = $("edit-id").value;
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

  const newTitle = $("edit-title").value.trim() || "Sans titre";
  const newDesc = $("edit-desc").value;
  const newDate = $("edit-date").value;
  const newColumnId = $("edit-status").value;
  const tagsInput = $("edit-tags").value;
  const newTags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
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

  const cardEl = kanbanShadowRoot.getElementById(taskId);
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
      columnId: newColumnId, tags: newTags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl,
      archived: task.archived || false
    });
    const body = {
      title: newTitle, notes: rawNotes,
      status: makeCompleted ? "completed" : "needsAction",
      due: newDate ? new Date(newDate).toISOString() : null
    };
    if (!makeCompleted) body.completed = null;
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);

    setSyncStatus("connected", "Modifiée !");
  } catch (error) {
    console.error("Échec de sauvegarde des modifications :", error);
    // 4. Rollback
    Object.assign(task, previousState);

    const currentCard = kanbanShadowRoot.getElementById(taskId);
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

  const taskId = $("edit-id").value;
  const task = allTasks[taskId];
  if (!task) return;
  if (!confirm("Voulez-vous vraiment supprimer définitivement cette tâche ?")) return;
  setSyncStatus("connecting", "Suppression...");
  try {
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "DELETE");
    const cardEl = kanbanShadowRoot.getElementById(taskId);
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

// --- Toast Gmail ---
export function showGmailToast(emailData) {
  capturedEmail = emailData;
  const toast = $("gmail-toast");
  if (toast) {
    $("gmail-toast-subject").innerText = emailData.title;
    toast.classList.add("visible");
  }
}

export function hideGmailToast() {
  const toast = $("gmail-toast");
  if (toast) {
    toast.classList.remove("visible");
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
    const rawNotes = serializeTaskNotes("Consulter l'e-mail lié ci-dessous pour plus de détails.", {
      columnId: "todo", tags: ["Gmail"], subtasks: [],
      gmailId: capturedEmail.gmailId, gmailSubject: capturedEmail.title,
      gmailUrl: capturedEmail.gmailUrl
    });
    const body = { title: capturedEmail.title, notes: rawNotes, status: "needsAction" };
    const createdRawTask = await apiCall(`/lists/${activeListId}/tasks`, "POST", body);
    const task = {
      id: createdRawTask.id, title: createdRawTask.title,
      desc: "Consulter l'e-mail lié ci-dessous pour plus de détails.",
      date: "", displayDate: "", tags: ["Gmail"], subtasks: [],
      gmailId: capturedEmail.gmailId, gmailSubject: capturedEmail.title,
      gmailUrl: capturedEmail.gmailUrl, columnId: "todo", completed: false
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

export async function checkLastCapturedEmail() {
  try {
    const storage = await chrome.storage.local.get(["lastCapturedEmail"]);
    if (storage.lastCapturedEmail) showGmailToast(storage.lastCapturedEmail);
  } catch (err) {
    console.error("Erreur lors du décodage de l'e-mail stocké :", err);
  }
}

// ============================================================================
// VUE SMART / OBJECTIF TRAVAIL
// ============================================================================
export function switchTab(tab) {
  const tabKanban = $("tab-kanban");
  const tabSmart = $("tab-smart");
  const viewKanban = $("view-kanban");
  const viewSmart = $("view-smart");

  if (tab === "kanban") {
    tabKanban.classList.add("active"); tabSmart.classList.remove("active");
    viewKanban.classList.remove("hidden"); viewSmart.classList.add("hidden");
  } else {
    tabSmart.classList.add("active"); tabKanban.classList.remove("active");
    viewKanban.classList.add("hidden"); viewSmart.classList.remove("hidden");
    renderSmartView();
  }
}

function renderSmartView() {
  const todayContainer = $("smart-today");
  const weekContainer = $("smart-week");
  todayContainer.innerHTML = "";
  weekContainer.innerHTML = "";

  const todayStr = getLocalDateString(new Date());
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = getLocalDateString(nextWeek);
  let todayCount = 0, weekCount = 0;

  Object.values(allTasks).forEach(task => {
    if (task.completed || !task.date) return;
    if (task.date === todayStr) { cloneCardToContainer(task, todayContainer); todayCount++; }
    else if (task.date > todayStr && task.date <= nextWeekStr) { cloneCardToContainer(task, weekContainer); weekCount++; }
  });

  if (todayCount === 0) todayContainer.innerHTML = `<p class="smart-empty">Aucune tâche planifiée pour aujourd'hui.</p>`;
  if (weekCount === 0) weekContainer.innerHTML = `<p class="smart-empty">Aucune tâche planifiée pour cette semaine.</p>`;
}

function cloneCardToContainer(task, container) {
  const card = document.createElement("div");
  card.className = "smart-card";
  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="card-tags">`;
    task.tags.forEach(tag => {
      const cls = tag.toLowerCase() === "urgent" ? "tag tag-urgent" : "tag tag-default";
      tagsHtml += `<span class="${cls}">${escapeHtml(tag)}</span>`;
    });
    tagsHtml += `</div>`;
  }
  card.innerHTML = `
    ${tagsHtml}
    <h4 class="card-title">${escapeHtml(task.title)}</h4>
    ${task.desc ? `<p class="card-desc" style="-webkit-line-clamp:1;">${escapeHtml(task.desc)}</p>` : ""}
    <div class="smart-card-footer">
      <span class="smart-date-badge">${task.displayDate}</span>
      <span class="smart-column-badge">${task.columnId === "inprogress" ? "En cours" : "À faire"}</span>
    </div>
  `;
  card.addEventListener("click", () => {
    switchTab("kanban");
    setTimeout(() => openEditor(task.id), 150);
  });
  container.appendChild(card);
}

// ============================================================================
// UTILITAIRES COMMUNS
// ============================================================================
export function clearColumns() {
  ["todo", "inprogress", "done"].forEach(id => {
    const col = $(`col-${id}`);
    if (col) col.innerHTML = "";
  });
}

export function toggleSkeletons(show) {
  ["todo", "inprogress", "done"].forEach(id => {
    const skeleton = $(`skeleton-${id}`);
    if (skeleton) {
      if (show) skeleton.classList.remove("hidden");
      else skeleton.classList.add("hidden");
    }
  });
}

export function updateBadges() {
  ["todo", "inprogress", "done"].forEach(id => {
    const col = $(`col-${id}`);
    const badge = $(`badge-${id}`);
    if (col && badge) {
      const count = col.children.length;
      badge.innerText = count;
      if (id === "done") {
        const btnArchive = $("btn-archive-done");
        if (btnArchive) {
          btnArchive.style.display = count > 0 ? "block" : "none";
        }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDateFriendly(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateForInput(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toISOString().split("T")[0];
}

function getLocalDateString(date) {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split("T")[0];
}

export function isUserTyping() {
  const activeEl = document.activeElement;
  if (!activeEl) return false;

  const isMainTyping = (
    activeEl.tagName === "INPUT" ||
    activeEl.tagName === "TEXTAREA" ||
    activeEl.isContentEditable ||
    activeEl.hasAttribute("contenteditable") ||
    activeEl.getAttribute("role") === "textbox"
  );
  if (isMainTyping) return true;

  if (kanbanShadowRoot && kanbanShadowRoot.activeElement) {
    const shadowActive = kanbanShadowRoot.activeElement;
    return (
      shadowActive.tagName === "INPUT" ||
      shadowActive.tagName === "TEXTAREA" ||
      shadowActive.isContentEditable ||
      shadowActive.hasAttribute("contenteditable")
    );
  }

  return false;
}

// Gestion des raccourcis clavier internes (Kanban Actif)
window.addEventListener("keydown", (e) => {
  if (!isKanbanActive) return;

  // Escape : Fermeture de l'éditeur ou du toast Gmail (toujours autorisé, même en cours de saisie)
  if (e.key === "Escape" || e.keyCode === 27) {
    const editor = $("editor-panel");
    const toast = $("gmail-toast");
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
  // e.code "KeyN" fonctionne sur macOS (Option) et Windows/Linux (Alt)
  if ((e.code === "KeyN" || e.key === "n" || e.key === "N" || e.keyCode === 78) && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    triggerAddNewTask("todo");
    return;
  }

  // Alt/Option + T : Alterne entre l'onglet "Tableau Kanban" et "Objectifs du jour"
  if (e.altKey && (e.code === "KeyT" || e.key === "t" || e.key === "T" || e.keyCode === 84)) {
    e.preventDefault();
    const tabKanban = $("tab-kanban");
    if (tabKanban) {
      if (tabKanban.classList.contains("active")) {
        switchTab("smart");
      } else {
        switchTab("kanban");
      }
    }
  }
}, true); // Phase de capture pour intercepter au plus tôt


// ============================================================================
// GESTION DYNAMIQUE ET INTERACTIVE DES SOUS-TÂCHES
// ============================================================================
function updateTaskCardContent(task) {
  if (!kanbanShadowRoot) return;
  const cardEl = kanbanShadowRoot.getElementById(task.id);
  if (!cardEl) return;

  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="card-tags">`;
    task.tags.forEach(tag => {
      const cls = tag.toLowerCase() === "urgent" ? "tag tag-urgent" : "tag tag-default";
      tagsHtml += `<span class="${cls}">${escapeHtml(tag)}</span>`;
    });
    tagsHtml += `</div>`;
  }

  const titleClass = task.completed ? "card-title completed" : "card-title";
  const descHtml = task.desc ? `<p class="card-desc">${escapeHtml(task.desc)}</p>` : "";

  let subtasksHtml = "";
  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter(s => s.completed).length;
    const totalCount = task.subtasks.length;
    const percent = Math.round((completedCount / totalCount) * 100);
    subtasksHtml = `
      <div class="card-subtasks">
        <div class="subtasks-text">
          <svg class="subtask-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${completedCount}/${totalCount} ${getMessage("subtasks_progression", "sous-tâches")}</span>
        </div>
        <div class="subtasks-progress-bar">
          <div class="subtasks-progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }

  let footerHtml = "";
  if (task.displayDate || task.gmailUrl) {
    footerHtml = `<div class="card-footer">`;
    if (task.displayDate) {
      footerHtml += `<span class="card-date">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
        </svg>
        ${task.displayDate}
      </span>`;
    } else {
      footerHtml += `<span></span>`;
    }
    if (task.gmailUrl) {
      footerHtml += `<span class="card-gmail-badge">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Gmail
      </span>`;
    }
    footerHtml += `</div>`;
  }

  cardEl.innerHTML = `${tagsHtml}<h4 class="${titleClass}">${escapeHtml(task.title)}</h4>${descHtml}${subtasksHtml}${footerHtml}`;
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
    console.error("Échec de synchronisation silencieuse des sous-tâches :", error);
  }
}

function handleAddSubtaskClick() {
  const taskId = $("edit-id").value;
  const task = allTasks[taskId];
  if (!task) return;

  const inputEl = $("new-subtask-title");
  const addBtn = $("btn-add-subtask");
  const title = inputEl.value.trim();
  if (!title) return;

  inputEl.value = "";
  if (addBtn) addBtn.disabled = true;
  if (!task.subtasks) task.subtasks = [];
  const newSubtask = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    completed: false
  };
  task.subtasks.push(newSubtask);

  renderSubtasksList(task);
  saveSubtasksOptimistic(task);
}

function renderSubtasksList(task) {
  const container = $("subtasks-container");
  if (!container) return;
  container.innerHTML = "";

  if (!task.subtasks || task.subtasks.length === 0) {
    container.innerHTML = `<p class="smart-empty" style="text-align: center; font-size: 11px; padding: 8px 0;">Aucune sous-tâche.</p>`;
    return;
  }

  task.subtasks.forEach(sub => {
    const item = document.createElement("div");
    item.className = "subtask-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "subtask-checkbox";
    checkbox.checked = sub.completed;
    checkbox.addEventListener("change", () => {
      sub.completed = checkbox.checked;
      if (sub.completed) {
        input.classList.add("completed");
      } else {
        input.classList.remove("completed");
      }
      saveSubtasksOptimistic(task);
    });

    const input = document.createElement("input");
    input.type = "text";
    input.className = sub.completed ? "subtask-input completed" : "subtask-input";
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
    btnDelete.className = "btn-delete-subtask";
    btnDelete.title = "Supprimer la sous-tâche";
    btnDelete.innerHTML = `
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:12px;height:12px;">
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
    const cardEl = kanbanShadowRoot ? kanbanShadowRoot.getElementById(task.id) : null;
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
    console.error("Erreur lors de l'archivage en arrière-plan :", error);
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

