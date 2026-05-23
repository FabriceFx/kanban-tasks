/**
 * src/dom-injector.js
 * Module de manipulation du DOM Gmail.
 * Gère l'injection des boutons dans la barre d'outils de message et la barre latérale.
 */

import { showKanban, isKanbanActive } from "./kanban-ui.js";

const GMAIL_SUBJECT_SELECTOR = "h2.hP";
const GMAIL_TOOLBAR_SELECTOR = "div[role='toolbar'], .Cq, .G-tF";

/** Extrait les détails de l'e-mail actuellement ouvert */
export function getEmailDetails() {
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
export function injectKanbanButton() {
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
          }
        });
      }
    });

    // Insérer de manière sécurisée en premier enfant de la barre d'outils
    toolbar.insertBefore(btnContainer, toolbar.firstChild);
  });
}

/** Injecte le menu "Tableau Kanban" dans la navigation latérale gauche de Gmail */
export function injectSidebarButton() {
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
  parent.insertBefore(item, ajlContainer);

  const link = item.querySelector("a");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
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
export function updateSidebarButtonStyle() {
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
