/**
 * src/content.js
 * Point d'entrée principal du script de contenu injecté dans Gmail.
 * Orchestre les modules sources et configure les listeners de navigation Gmail.
 */

import { observer } from "./observer.js";
import { injectSidebarButton } from "./dom-injector.js";
import { isKanbanActive, showKanban, hideKanban, isUserTyping } from "./kanban-ui.js";

// Lancer l'observation globale du DOM Gmail
observer.observe(document.body, { childList: true, subtree: true });

// Gestion des changements de hash (navigation Gmail via raccourcis clavier ou autre)
window.addEventListener("hashchange", () => {
  if (isKanbanActive) hideKanban();
});

// Gestion de l'historique de navigation (boutons Précédent/Suivant du navigateur)
window.addEventListener("popstate", () => {
  if (isKanbanActive) hideKanban();
});

// Raccourci global Alt/Option + K pour basculer la visibilité du Tableau Kanban
window.addEventListener("keydown", (e) => {
  // Ignorer si l'utilisateur est en train de saisir du texte
  if (isUserTyping()) return;

  // e.code est indépendant du système et fonctionne sur macOS (touche Option) et Windows/Linux (Alt)
  if (e.altKey && (e.code === "KeyK" || e.key === "k" || e.key === "K" || e.keyCode === 75)) {
    e.preventDefault();
    if (isKanbanActive) {
      hideKanban();
    } else {
      showKanban();
    }
  }
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
