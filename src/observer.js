/**
 * src/observer.js
 * Module de gestion de l'observation DOM.
 * Gère la boucle de MutationObserver de Gmail avec throttle de 100ms et verrou asynchrone.
 */

import { injectSidebarButton } from "./dom-injector.js";
import { isKanbanActive, showKanban, syncKanbanVisibility } from "./kanban-ui.js";

export let isPerformingMutation = false;
let lastRunTime = 0;
let throttleTimeout = null;
const THROTTLE_DELAY = 100; // Fréquence d'exécution max de 100ms

export function scheduleSafeInject() {
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

export const observer = new MutationObserver(() => {
  scheduleSafeInject();
});

/** Fonction d'injection sécurisée utilisant un verrou et une réinjection si nécessaire */
export function safeInject() {
  if (isPerformingMutation) return;
  isPerformingMutation = true;
  
  try {
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
