import { showKanban, isKanbanActive } from "./kanban-ui.js";

// --- Traduction / Internationalisation ---
function getMessage(key, defaultValue = "") {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getMessage(key) || defaultValue;
  }
  return defaultValue;
}


/** Injecte le menu "Tableau Kanban" dans la navigation latérale gauche de Gmail */
export function injectSidebarButton() {
  const tkContainer = document.querySelector(".TK");
  const ajlContainer = document.querySelector(".ajl");

  let item = document.getElementById("gmail-sidebar-kanban");
  const isNew = !item;

  if (isNew) {
    item = document.createElement("div");
    item.id = "gmail-sidebar-kanban";
    item.className = "aim";
    item.style.marginBottom = "4px"; // Espacement propre
    
    // Structure HTML native-like de Gmail pour aligner parfaitement l'icône (.qj) et le texte (.nU)
    // Nous appliquons le style de capsule (hover/active, hauteur, padding) sur le conteneur .TO comme Gmail.
    item.innerHTML = `
      <div class="TO" style="user-select:none; display:flex !important; align-items:center !important; height:32px !important; padding-left:16px !important; border-radius:100px !important; margin-right:8px !important; cursor:pointer !important; transition:background-color 0.15s !important;">
        <span class="qj" style="display:flex !important; align-items:center !important; justify-content:center !important; width:20px !important; height:20px !important; margin-right:18px !important;">
          <svg fill="none" stroke="#444746" stroke-width="2.2" viewBox="0 0 24 24" style="width:20px;height:20px;transition:stroke 0.15s;" id="sidebar-kanban-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
        </span>
        <span class="nU" style="display:flex !important; align-items:center !important; flex-grow:1 !important;">
          <a class="J-Ke n0" id="gmail-sidebar-kanban-link" href="#" title="${getMessage("sidebar_kanban_title", "Ouvrir le Tableau Kanban Tasks")}" style="color:#444746 !important;font-family:'Google Sans',Roboto,sans-serif !important;font-size:14px !important;font-weight:500 !important;text-decoration:none !important; padding:0 !important; margin:0 !important; border:none !important; background:transparent !important; outline:none !important; width:100% !important; transition:color 0.15s !important;">
            <span id="sidebar-kanban-text" data-i18n="sidebar_kanban_text">${getMessage("sidebar_kanban_text", "Tableau Kanban")}</span>
          </a>
        </span>
      </div>
    `;

    // Utilisation de la délégation d'événement pour que le clic sur n'importe quelle partie (capsule, icône, texte) réagisse toujours
    const toDiv = item.querySelector(".TO");
    toDiv.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showKanban();
    });

    toDiv.addEventListener("mouseenter", () => {
      if (!isKanbanActive) toDiv.style.setProperty("background-color", "rgba(0,0,0,0.04)", "important");
    });
    toDiv.addEventListener("mouseleave", () => {
      if (!isKanbanActive) toDiv.style.setProperty("background-color", "transparent", "important");
    });
  }

  // Insertion intelligente avec vérification dynamique du parent/voisin :
  // 1. En priorité, juste sous le dossier "Boîte de réception" (Inbox)
  // 2. Sinon, à la fin du conteneur des labels système (.TK)
  // 3. Sinon, juste avant le conteneur des labels personnalisés (.ajl)
  // 4. En dernier recours, au parent de la liste
  const inboxLink = document.querySelector('a[href*="#inbox"]') || 
                    document.querySelector('a[title*="Inbox"]') || 
                    document.querySelector('a[title*="Boîte de réception"]');
  const inboxItem = inboxLink ? inboxLink.closest('.aim') : null;

  if (inboxItem && inboxItem.parentNode) {
    if (item.previousSibling !== inboxItem) {
      inboxItem.parentNode.insertBefore(item, inboxItem.nextSibling);
    }
  } else if (tkContainer) {
    if (item.parentNode !== tkContainer) {
      tkContainer.appendChild(item);
    }
  } else if (ajlContainer && ajlContainer.parentNode) {
    if (item.parentNode !== ajlContainer.parentNode) {
      ajlContainer.parentNode.insertBefore(item, ajlContainer);
    }
  } else {
    const fallbackContainer = document.querySelector(".ajl") || document.querySelector(".TK");
    if (fallbackContainer && fallbackContainer.parentNode) {
      if (item.parentNode !== fallbackContainer.parentNode) {
        fallbackContainer.parentNode.insertBefore(item, fallbackContainer);
      }
    } else {
      return; // Impossible de trouver un point d'injection
    }
  }

  updateSidebarButtonStyle();
}

/** Met à jour le style visuel actif/inactif du bouton de la barre latérale */
export function updateSidebarButtonStyle() {
  const item = document.getElementById("gmail-sidebar-kanban");
  if (!item) return;
  const toDiv = item.querySelector(".TO");
  const link = item.querySelector("a");
  const icon = item.querySelector("#sidebar-kanban-icon");
  const text = item.querySelector("#sidebar-kanban-text");
  if (!toDiv || !link || !icon || !text) return;

  if (isKanbanActive) {
    toDiv.style.setProperty("background-color", "#c2e7ff", "important");
    link.style.setProperty("color", "#041e49", "important");
    icon.setAttribute("stroke", "#0b57d0");
    text.style.setProperty("color", "#041e49", "important");
    text.style.setProperty("font-weight", "700", "important");
  } else {
    toDiv.style.setProperty("background-color", "transparent", "important");
    link.style.setProperty("color", "#444746", "important");
    icon.setAttribute("stroke", "#444746");
    text.style.setProperty("color", "#444746", "important");
    text.style.setProperty("font-weight", "500", "important");
  }
}
