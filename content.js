/**
 * content.js
 * Script de contenu injecté dans Gmail.
 * 
 * Architecture : Shadow DOM
 * - Injecte un bouton "Tableau Kanban" dans la barre latérale Gmail
 * - Injecte un bouton "Ajouter au Kanban" dans la barre d'outils d'un e-mail ouvert
 * - Quand #kanban est actif, remplace la zone principale de Gmail par un Shadow DOM
 *   contenant l'intégralité de l'interface Kanban avec accès complet aux APIs Chrome
 * 
 * Les fonctions parseTaskNotes, serializeTaskNotes, isConfigTask sont
 * disponibles globalement via parser.js (chargé avant dans content_scripts).
 */

// ============================================================================
// SECTION 1 : État global & Constantes
// ============================================================================
const GMAIL_SUBJECT_SELECTOR = "h2.hP";
const GMAIL_TOOLBAR_SELECTOR = "div[role='toolbar'], .Cq, .G-tF";

let kanbanShadowRoot = null;
let kanbanInitialized = false;
let originalDisplayStates = new Map();
let isKanbanActive = false; // Gère l'affichage/masquage de l'interface indépendamment des hashs

// État de l'application Kanban
let authToken = null;
let activeListId = null;
let allTasks = {};
let capturedEmail = null;

// ============================================================================
// SECTION 2 : Template HTML du Kanban (injecté dans le Shadow DOM)
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
            <option value="" disabled selected>Chargement...</option>
          </select>
        </div>
        <div class="header-actions">
          <div id="sync-status" class="sync-badge">
            <span class="sync-dot" id="sync-dot"></span>
            <span id="sync-text">Synchro...</span>
          </div>
          <button id="btn-logout" class="btn-icon danger hidden" title="Se déconnecter">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
          <button id="btn-fullscreen" class="btn-icon" title="Ouvrir dans un nouvel onglet">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tab-switcher">
        <button id="tab-kanban" class="tab-btn active">Tableau Kanban</button>
        <button id="tab-smart" class="tab-btn">Objectif Travail</button>
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
            <h2 class="wizard-title">Accès à vos tâches Google</h2>
            <p class="wizard-desc">Pour stocker de façon décentralisée et gratuite vos données, vous devez lier votre propre clé OAuth2 sécurisée.</p>
          </div>

          <div class="wizard-steps">
            <h3 class="wizard-steps-title">🛠️ Étape de configuration rapide</h3>
            <div class="step-row">
              <span class="step-number">1</span>
              <p>Copiez l'ID d'extension généré :<br><code id="extension-id-display">Chargement...</code></p>
            </div>
            <div class="step-row">
              <span class="step-number">2</span>
              <p>Dans votre <a href="https://console.cloud.google.com" target="_blank">Google Console</a>, créez des identifiants <strong>ID de client OAuth</strong> de type <strong>Application Chrome</strong> avec cet ID.</p>
            </div>
            <div class="step-row">
              <span class="step-number">3</span>
              <p>Activer la <strong>Google Tasks API</strong> et insérez votre clé <strong>client_id</strong> dans le fichier <strong>manifest.json</strong>.</p>
            </div>
          </div>

          <div>
            <button id="btn-login" class="btn-google">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Se connecter avec Google
            </button>
            <p class="wizard-footer-text" style="margin-top: 12px;">Vos données de tâches transitent uniquement entre Chrome et les serveurs sécurisés de Google.</p>
          </div>
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
            <span class="toast-label">E-mail ouvert</span>
          </div>
          <button id="btn-close-toast" class="btn-close-toast">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p id="gmail-toast-subject" class="toast-subject"></p>
        <button id="btn-add-gmail-task" class="btn-toast-add">Créer une tâche Kanban</button>
      </div>

      <!-- VUE KANBAN -->
      <div id="view-kanban" class="view-kanban">
        <!-- Colonne À FAIRE -->
        <div id="col-todo-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">À faire</span>
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
            Ajouter une tâche
          </button>
        </div>

        <!-- Colonne EN COURS -->
        <div id="col-inprogress-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">En cours</span>
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
            Ajouter une tâche
          </button>
        </div>

        <!-- Colonne TERMINÉ -->
        <div id="col-done-container" class="kanban-column">
          <div class="column-header">
            <span class="column-title">Terminé</span>
            <span id="badge-done" class="column-badge badge-done">0</span>
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
            Ajouter une tâche
          </button>
        </div>
      </div>

      <!-- VUE SMART -->
      <div id="view-smart" class="view-smart hidden">
        <div>
          <h2 class="smart-section-title today">
            <span class="smart-dot today"></span> Aujourd'hui
          </h2>
          <div id="smart-today">
            <p class="smart-empty">Aucune tâche planifiée pour aujourd'hui.</p>
          </div>
        </div>
        <div>
          <h2 class="smart-section-title week">
            <span class="smart-dot week"></span> Cette semaine
          </h2>
          <div id="smart-week">
            <p class="smart-empty">Aucune tâche planifiée pour cette semaine.</p>
          </div>
        </div>
      </div>

      <!-- PANNEAU D'ÉDITION -->
      <div id="editor-panel" class="editor-overlay hidden">
        <div class="editor-panel">
          <div class="editor-header">
            <h3>Détails de la tâche</h3>
            <button id="btn-close-editor" class="btn-close-editor">Fermer</button>
          </div>
          <div class="editor-body">
            <input type="hidden" id="edit-id">
            <div>
              <label class="form-label">Titre</label>
              <input type="text" id="edit-title" class="form-input" placeholder="Nommez votre tâche...">
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea id="edit-desc" rows="4" class="form-textarea" placeholder="Rédigez des détails ou consignes..."></textarea>
            </div>
            <div class="form-row">
              <div>
                <label class="form-label">Échéance</label>
                <input type="date" id="edit-date" class="form-input">
              </div>
              <div>
                <label class="form-label">Statut</label>
                <select id="edit-status" class="form-select">
                  <option value="todo">À faire</option>
                  <option value="inprogress">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label">Étiquettes (séparées par virgules)</label>
              <input type="text" id="edit-tags" class="form-input" placeholder="ex: Urgent, Projet client">
            </div>
            <div id="gmail-context" class="gmail-context hidden">
              <div class="gmail-context-header">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="gmail-context-label">E-mail Gmail d'origine</span>
              </div>
              <p id="gmail-subject" class="gmail-context-subject"></p>
              <a id="gmail-link" href="#" target="_blank" class="gmail-context-link">
                Consulter l'e-mail dans Gmail
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
                </svg>
              </a>
            </div>
          </div>
          <div class="editor-footer">
            <button id="btn-delete-task" class="btn-delete" title="Supprimer la tâche">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <button id="btn-save-changes" class="btn-save">Enregistrer les modifications</button>
          </div>
        </div>
      </div>

    </main>
  </div>
  `;
}

// ============================================================================
// SECTION 3 : Intégration Gmail — Bouton Sidebar & Bouton Toolbar
// ============================================================================

/** Extrait les détails de l'e-mail actuellement ouvert */
function getEmailDetails() {
  const hash = window.location.hash;
  const mailHashPattern = /#.+?\/([a-zA-Z0-9_-]{8,})/;
  const match = hash.match(mailHashPattern);
  if (match && match[1]) {
    const threadId = match[1];
    const subjectElement = document.querySelector(GMAIL_SUBJECT_SELECTOR);
    const subject = subjectElement ? subjectElement.innerText.trim() : "E-mail sans objet";
    return { title: subject, gmailId: threadId, gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${threadId}` };
  }
  return null;
}

/** Injecte le bouton "Ajouter au Kanban" dans la barre d'outils de l'e-mail */
function injectKanbanButton() {
  const toolbars = document.querySelectorAll(GMAIL_TOOLBAR_SELECTOR);
  if (toolbars.length === 0) return;

  toolbars.forEach((toolbar) => {
    // Vérifier si cette barre d'outils spécifique a déjà le bouton injecté
    if (toolbar.querySelector(".gmail-kanban-trigger-class")) return;

    const btnContainer = document.createElement("div");
    btnContainer.className = "gmail-kanban-trigger-class J-J5-Ji";
    btnContainer.title = "Ajouter au Tableau Kanban";
    Object.assign(btnContainer.style, {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "background-color 0.15s, transform 0.15s",
      backgroundColor: "transparent",
      marginLeft: "6px",
      marginRight: "6px"
    });
    
    btnContainer.innerHTML = `
      <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s, transform 0.15s;" class="kanban-trigger-svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
      </svg>
    `;

    // Effets de survol
    btnContainer.addEventListener("mouseenter", () => {
      const svg = btnContainer.querySelector(".kanban-trigger-svg");
      if (btnContainer.style.backgroundColor !== "rgb(194, 231, 255)") { // Si pas déjà dans l'état bleu "Ajouté"
        btnContainer.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
        if (svg) svg.setAttribute("stroke", "#1f1f1f");
      }
    });

    btnContainer.addEventListener("mouseleave", () => {
      const svg = btnContainer.querySelector(".kanban-trigger-svg");
      if (btnContainer.style.backgroundColor !== "rgb(194, 231, 255)") { // Si pas déjà dans l'état bleu "Ajouté"
        btnContainer.style.backgroundColor = "transparent";
        if (svg) svg.setAttribute("stroke", "#444746");
      }
    });

    // Événement clic
    btnContainer.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const emailDetails = getEmailDetails();
      if (emailDetails) {
        chrome.runtime.sendMessage({ type: "EMAIL_CAPTURED", data: emailDetails }, (response) => {
          if (!chrome.runtime.lastError) {
            const svg = btnContainer.querySelector(".kanban-trigger-svg");
            
            // Animation de confirmation "Ajouté !" (devient bleu avec un léger zoom de l'icône)
            btnContainer.style.backgroundColor = "#c2e7ff";
            btnContainer.title = "Ajouté au Kanban !";
            if (svg) {
              svg.setAttribute("stroke", "#0b57d0");
              svg.style.transform = "scale(1.15)";
            }

            setTimeout(() => {
              btnContainer.style.backgroundColor = "transparent";
              btnContainer.title = "Ajouter au Tableau Kanban";
              if (svg) {
                svg.setAttribute("stroke", "#444746");
                svg.style.transform = "scale(1)";
              }
            }, 2000);

            // Si le Kanban est déjà affiché, montrer le toast directement
            if (kanbanShadowRoot && isKanbanActive) {
              showGmailToast(emailDetails);
            }
          }
        });
      }
    });

    // Insérer de manière sécurisée en premier enfant de la barre d'outils
    toolbar.insertBefore(btnContainer, toolbar.firstChild);
  });
}

/** Injecte le menu "Tableau Kanban" dans la navigation latérale gauche de Gmail */
function injectSidebarButton() {
  const ajlContainer = document.querySelector(".ajl") || document.querySelector(".TK");
  if (!ajlContainer) return;
  const parent = ajlContainer.parentNode;
  if (!parent) return;

  // Si le bouton est déjà présent comme frère du conteneur, on ne fait rien
  if (parent.querySelector("#gmail-sidebar-kanban")) return;

  // Nettoyer d'éventuels doublons orphelins dans d'autres conteneurs obsolètes
  const oldButton = document.getElementById("gmail-sidebar-kanban");
  if (oldButton) {
    oldButton.remove();
  }

  const item = document.createElement("div");
  item.id = "gmail-sidebar-kanban";
  item.className = "aim";
  item.style.marginBottom = "4px"; // Espacement propre avec la liste .ajl
  item.innerHTML = `
    <div class="TO" style="user-select:none;">
      <div>
        <a class="J-Ke n0" id="gmail-sidebar-kanban-link" href="#" title="Ouvrir le Tableau Kanban Tasks" style="display:flex;align-items:center;gap:12px;padding-left:26px;height:32px;color:#444746;font-family:'Google Sans',Roboto,sans-serif;font-size:14px;font-weight:500;text-decoration:none;border-radius:0 16px 16px 0;margin-right:8px;transition:background-color 0.15s;">
          <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s;" id="sidebar-kanban-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
          <span style="color:#444746;font-weight:500;transition:color 0.15s;" id="sidebar-kanban-text">Tableau Kanban</span>
        </a>
      </div>
    </div>
  `;
  // On insère le bouton en tant que frère juste au-dessus du bloc complet de la liste des dossiers de Gmail (.ajl).
  // Ainsi, le Tableau Kanban n'est plus du tout vu par le moteur de rendu dynamique de la liste de Gmail,
  // ce qui résout à 100% le problème de duplication/triplement des dossiers lors des mises à jour d'unread count !
  parent.insertBefore(item, ajlContainer);

  const link = item.querySelector("a");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // Évite que le clic ne remonte et ne perturbe le routeur/menu Gmail
    showKanban();
  });

  link.addEventListener("mouseenter", () => {
    if (!isKanbanActive) link.style.backgroundColor = "rgba(0,0,0,0.04)";
  });
  link.addEventListener("mouseleave", () => {
    if (!isKanbanActive) link.style.backgroundColor = "transparent";
  });

  updateSidebarButtonStyle();
}

/** Met à jour le style visuel actif/inactif du bouton de la barre latérale */
function updateSidebarButtonStyle() {
  const item = document.getElementById("gmail-sidebar-kanban");
  if (!item) return;
  const link = item.querySelector("a");
  const icon = item.querySelector("#sidebar-kanban-icon");
  const text = item.querySelector("#sidebar-kanban-text");
  if (!link || !icon || !text) return;

  if (isKanbanActive) {
    link.style.backgroundColor = "#c2e7ff";
    link.style.color = "#041e49";
    icon.setAttribute("stroke", "#0b57d0");
    text.style.color = "#041e49";
    text.style.fontWeight = "700";
  } else {
    link.style.backgroundColor = "transparent";
    link.style.color = "#444746";
    icon.setAttribute("stroke", "#444746");
    text.style.color = "#444746";
    text.style.fontWeight = "500";
  }
}

// ============================================================================
// SECTION 4 : Contrôle de l'Affichage & Shadow DOM
// ============================================================================

/** Affiche l'interface Kanban intégrée en masquant la zone principale de Gmail */
function showKanban() {
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

/** Masque l'interface Kanban et restaure la vue standard de Gmail */
function hideKanban() {
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

/** Synchronise la visibilité : s'assure que les nouveaux éléments ajoutés par Gmail restent masqués si le Kanban est ouvert */
function syncKanbanVisibility() {
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
// SECTION 5 : Logique de l'Application Kanban
// ============================================================================

/** Raccourci pour accéder aux éléments dans le Shadow DOM */
function $(id) {
  return kanbanShadowRoot.getElementById(id);
}

/** Appel API via le proxy background.js */
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

/** Initialise l'application Kanban dans le Shadow DOM */
function initKanbanApp() {
  setupKanbanEventListeners();
  initAuth();
  checkLastCapturedEmail();
}

/** Configure tous les écouteurs d'événements */
function setupKanbanEventListeners() {
  // Onglets
  $("tab-kanban").addEventListener("click", () => switchTab("kanban"));
  $("tab-smart").addEventListener("click", () => switchTab("smart"));

  // Sélecteur de board
  $("board-select").addEventListener("change", (e) => {
    activeListId = e.target.value;
    chrome.storage.local.set({ activeListId });
    loadTasks(activeListId);
  });

  // Boutons d'ajout rapide
  $("btn-add-todo").addEventListener("click", () => triggerAddNewTask("todo"));
  $("btn-add-inprogress").addEventListener("click", () => triggerAddNewTask("inprogress"));
  $("btn-add-done").addEventListener("click", () => triggerAddNewTask("done"));

  // Éditeur
  $("btn-close-editor").addEventListener("click", closeEditor);
  $("btn-save-changes").addEventListener("click", saveChanges);
  $("btn-delete-task").addEventListener("click", triggerDeleteTask);

  // Auth
  $("btn-login").addEventListener("click", () => authenticate(true));
  $("btn-logout").addEventListener("click", logout);

  // Plein écran (nouvel onglet)
  $("btn-fullscreen").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
  });

  // Toast Gmail
  $("btn-close-toast").addEventListener("click", hideGmailToast);
  $("btn-add-gmail-task").addEventListener("click", openEditorWithCapturedEmail);

  // Drag & Drop sur les conteneurs de colonnes
  ["todo", "inprogress", "done"].forEach(columnId => {
    const container = $(`col-${columnId}-container`);
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
  chrome.runtime.sendMessage({ type: "GET_TASKS_TOKEN", interactive }, (response) => {
    if (chrome.runtime.lastError) {
      setSyncStatus("offline", "Erreur extension");
      return;
    }
    if (response && response.success && response.token) {
      authToken = response.token;
      $("setup-wizard").classList.add("hidden");
      $("btn-logout").classList.remove("hidden");
      setSyncStatus("connected", "Connecté");
      loadBoards();
    } else {
      authToken = null;
      $("setup-wizard").classList.remove("hidden");
      $("btn-logout").classList.add("hidden");
      setSyncStatus("offline", "Non authentifié");
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
    $("board-select").innerHTML = '<option value="" disabled selected>Veuillez vous connecter</option>';
    clearColumns();
  });
}

// --- Sync Status ---
function setSyncStatus(state, text) {
  const dot = $("sync-dot");
  const label = $("sync-text");
  if (!dot || !label) return;
  label.innerText = text;
  dot.className = "sync-dot " + state;
}

// --- Chargement des Boards ---
async function loadBoards() {
  try {
    setSyncStatus("connecting", "Synchro listes...");
    const data = await apiCall("/users/@me/lists");
    const boardSelect = $("board-select");
    boardSelect.innerHTML = "";

    if (data && data.items && data.items.length > 0) {
      data.items.forEach(list => {
        const option = document.createElement("option");
        option.value = list.id;
        option.innerText = list.title;
        boardSelect.appendChild(option);
      });

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

// --- Chargement des Tâches ---
async function loadTasks(listId) {
  if (!listId) return;
  clearColumns();
  toggleSkeletons(true);
  setSyncStatus("connecting", "Chargement tâches...");

  try {
    const data = await apiCall(`/lists/${listId}/tasks?showCompleted=true&showHidden=true`);
    toggleSkeletons(false);
    allTasks = {};
    const taskItems = (data && data.items) || [];

    taskItems.forEach(rawTask => {
      if (isConfigTask(rawTask)) return;
      const { description, metadata } = parseTaskNotes(rawTask.notes);
      let columnId = metadata.columnId || "todo";
      if (rawTask.status === "completed") columnId = "done";

      const task = {
        id: rawTask.id, title: rawTask.title, desc: description,
        date: rawTask.due ? formatDateForInput(rawTask.due) : "",
        displayDate: rawTask.due ? formatDateFriendly(rawTask.due) : "",
        tags: metadata.tags || [], subtasks: metadata.subtasks || [],
        gmailId: metadata.gmailId, gmailSubject: metadata.gmailSubject,
        gmailUrl: metadata.gmailUrl, columnId,
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

// --- Rendu des Cartes ---
function renderTaskCard(task) {
  const targetCol = $(`col-${task.columnId}`);
  if (!targetCol) return;

  const card = document.createElement("div");
  card.id = task.id;
  card.draggable = true;
  card.className = "task-card";

  // Tags
  let tagsHtml = "";
  if (task.tags && task.tags.length > 0) {
    tagsHtml = `<div class="card-tags">`;
    task.tags.forEach(tag => {
      const cls = tag.toLowerCase() === "urgent" ? "tag tag-urgent" : "tag tag-default";
      tagsHtml += `<span class="${cls}">${escapeHtml(tag)}</span>`;
    });
    tagsHtml += `</div>`;
  }

  // Titre
  const titleClass = task.completed ? "card-title completed" : "card-title";

  // Description
  const descHtml = task.desc ? `<p class="card-desc">${escapeHtml(task.desc)}</p>` : "";

  // Pied
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

  card.innerHTML = `${tagsHtml}<h4 class="${titleClass}">${escapeHtml(task.title)}</h4>${descHtml}${footerHtml}`;

  // Drag & Drop
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => card.classList.add("dragging"), 0);
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  // Clic éditeur
  card.addEventListener("click", () => openEditor(task.id));

  targetCol.appendChild(card);
}

// --- Drag & Drop Persistance ---
async function handleTaskColumnMove(taskId, columnId) {
  const task = allTasks[taskId];
  if (!task) return;
  const previousColumn = task.columnId;
  task.columnId = columnId;
  const makeCompleted = (columnId === "done");
  task.completed = makeCompleted;
  setSyncStatus("connecting", "Enregistrement...");

  try {
    const rawNotes = serializeTaskNotes(task.desc, {
      columnId, tags: task.tags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl
    });
    const body = { notes: rawNotes, status: makeCompleted ? "completed" : "needsAction" };
    if (!makeCompleted) body.completed = null;
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);

    const cardEl = kanbanShadowRoot.getElementById(taskId);
    if (cardEl) {
      const h4 = cardEl.querySelector("h4");
      h4.className = makeCompleted ? "card-title completed" : "card-title";
    }
    setSyncStatus("connected", "Déplacé !");
  } catch (error) {
    task.columnId = previousColumn;
    task.completed = (previousColumn === "done");
    loadTasks(activeListId);
    setSyncStatus("error", "Sync échec");
  }
}

// --- Ajout de tâche ---
async function triggerAddNewTask(columnId) {
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

  const newTitle = $("edit-title").value.trim() || "Sans titre";
  const newDesc = $("edit-desc").value;
  const newDate = $("edit-date").value;
  const newColumnId = $("edit-status").value;
  const tagsInput = $("edit-tags").value;
  const newTags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
  const makeCompleted = (newColumnId === "done");
  setSyncStatus("connecting", "Sauvegarde...");

  try {
    const rawNotes = serializeTaskNotes(newDesc, {
      columnId: newColumnId, tags: newTags, subtasks: task.subtasks,
      gmailId: task.gmailId, gmailSubject: task.gmailSubject, gmailUrl: task.gmailUrl
    });
    const body = {
      title: newTitle, notes: rawNotes,
      status: makeCompleted ? "completed" : "needsAction",
      due: newDate ? new Date(newDate).toISOString() : null
    };
    if (!makeCompleted) body.completed = null;
    await apiCall(`/lists/${activeListId}/tasks/${taskId}`, "PATCH", body);

    task.title = newTitle; task.desc = newDesc; task.date = newDate;
    task.displayDate = newDate ? formatDateFriendly(newDate) : "";
    task.columnId = newColumnId; task.tags = newTags; task.completed = makeCompleted;

    const cardEl = kanbanShadowRoot.getElementById(taskId);
    if (cardEl) cardEl.remove();
    renderTaskCard(task);
    updateBadges();
    closeEditor();
    setSyncStatus("connected", "Modifiée !");
  } catch (error) {
    setSyncStatus("error", "Sync échec");
  }
}

async function triggerDeleteTask() {
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
    closeEditor();
    setSyncStatus("connected", "Supprimée");
  } catch (error) {
    setSyncStatus("error", "Échec suppression");
  }
}

// --- Toast Gmail ---
function showGmailToast(emailData) {
  capturedEmail = emailData;
  const toast = $("gmail-toast");
  $("gmail-toast-subject").innerText = emailData.title;
  toast.classList.add("visible");
}

function hideGmailToast() {
  $("gmail-toast").classList.remove("visible");
  chrome.storage.local.remove("lastCapturedEmail").catch(() => {});
}

async function openEditorWithCapturedEmail() {
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
    if (storage.lastCapturedEmail) showGmailToast(storage.lastCapturedEmail);
  } catch (err) {
    console.error("Erreur lors du décodage de l'e-mail stocké :", err);
  }
}

// --- Vue Smart ---
function switchTab(tab) {
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

// --- Utilitaires ---
function clearColumns() {
  ["todo", "inprogress", "done"].forEach(id => {
    const col = $(`col-${id}`);
    if (col) col.innerHTML = "";
  });
}

function toggleSkeletons(show) {
  ["todo", "inprogress", "done"].forEach(id => {
    const skeleton = $(`skeleton-${id}`);
    if (skeleton) {
      if (show) skeleton.classList.remove("hidden");
      else skeleton.classList.add("hidden");
    }
  });
}

function updateBadges() {
  ["todo", "inprogress", "done"].forEach(id => {
    const col = $(`col-${id}`);
    const badge = $(`badge-${id}`);
    if (col && badge) badge.innerText = col.children.length;
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

// ============================================================================
// SECTION 6 : Observateur DOM Gmail & Initialisation
// ============================================================================

let isPerformingMutation = false;
let lastRunTime = 0;
let throttleTimeout = null;
const THROTTLE_DELAY = 100; // Fréquence d'exécution max de 100ms

function scheduleSafeInject() {
  if (isPerformingMutation) return; // Ignore nos propres changements de DOM
  
  const now = Date.now();
  if (now - lastRunTime >= THROTTLE_DELAY) {
    if (throttleTimeout) {
      clearTimeout(throttleTimeout);
      throttleTimeout = null;
    }
    lastRunTime = now;
    safeInject();
  } else {
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        lastRunTime = Date.now();
        throttleTimeout = null;
        safeInject();
      }, THROTTLE_DELAY - (now - lastRunTime));
    }
  }
}

const observer = new MutationObserver(() => {
  scheduleSafeInject();
});

/** Fonction d'injection sécurisée utilisant un verrou et une réinjection si nécessaire */
function safeInject() {
  if (isPerformingMutation) return;
  isPerformingMutation = true;
  
  try {
    const emailDetails = getEmailDetails();
    if (emailDetails) {
      injectKanbanButton();
    } else {
      const buttons = document.querySelectorAll(".gmail-kanban-trigger-class");
      buttons.forEach(btn => btn.remove());
    }
    injectSidebarButton();
    
    // Si le Kanban est censé être ouvert, vérifier s'il est toujours présent et dans le bon parent
    if (isKanbanActive) {
      const mainPane = document.querySelector("div[role='main']");
      const embed = document.getElementById("gmail-kanban-embed");
      if (mainPane && (!embed || embed.parentNode !== mainPane)) {
        console.log("[Kanban] Conteneur Kanban manquant ou déplacé par Gmail, ré-injection...");
        showKanban();
      }
    }
    syncKanbanVisibility();
  } catch (err) {
    console.error("Erreur lors de l'injection sécurisée de Kanban Tasks :", err);
  } finally {
    // On libère le verrou par un setTimeout (macrotask) pour s'assurer que toutes les
    // mutations synchrones et leurs microtasks correspondantes du MutationObserver ont été ignorées.
    setTimeout(() => {
      isPerformingMutation = false;
    }, 0);
  }
}

observer.observe(document.body, { childList: true, subtree: true });

// Gestion des changements de hash (navigation Gmail via raccourcis clavier ou autre)
window.addEventListener("hashchange", () => {
  if (isKanbanActive) hideKanban();
});

// Gestion de l'historique de navigation (boutons Précédent/Suivant du navigateur)
window.addEventListener("popstate", () => {
  if (isKanbanActive) hideKanban();
});

// Interception des clics sur la navigation Gmail pour refermer automatiquement le Kanban
document.addEventListener("click", (e) => {
  if (!isKanbanActive) return;

  // Ignorer si le clic est à l'intérieur de notre Kanban Shadow DOM
  const embedContainer = document.getElementById("gmail-kanban-embed");
  if (embedContainer && embedContainer.contains(e.target)) {
    return;
  }

  // Si on clique sur un lien, un bouton ou un rôle interactif propre à Gmail
  const closestLink = e.target.closest("a");
  const closestButton = e.target.closest("button");
  const closestRoleLink = e.target.closest("[role='link']");
  const closestRoleTab = e.target.closest("[role='tab']");

  if (closestLink || closestButton || closestRoleLink || closestRoleTab) {
    // Si c'est notre propre bouton de sidebar, on ignore (il gère déjà son propre clic)
    if (closestLink && closestLink.id === "gmail-sidebar-kanban-link") {
      return;
    }
    // Sinon, l'utilisateur a navigué ailleurs dans Gmail -> on referme le Kanban
    hideKanban();
  }
}, true); // Phase de capture pour intercepter l'événement au plus tôt

window.addEventListener("load", () => {
  setTimeout(() => {
    injectSidebarButton();
  }, 1000);
});