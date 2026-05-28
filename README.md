# 📦 Kanban Tasks - Gmail edition

[🇫🇷 Version Française](#-version-française) | [🇬🇧 English Version](#-english-version)

---

## 🇫🇷 Version Française

> Une extension Google Chrome (Manifest V3) ultra-moderne qui transforme l'interface de Gmail en un puissant outil de productivité visuel et décentralisé.

Grâce à une intégration invisible et respectueuse du DOM de Gmail, **Kanban Tasks** injecte un tableau Kanban complet et hautement réactif conforme à la charte graphique de **Google Material 3** directement dans la zone principale de Gmail, tout en offrant la possibilité de l'ouvrir dans un panneau latéral ou un onglet dédié.

---

## 🌟 Caractéristiques & innovations

### 1. Intégration Gmail directe & invisible
* **Tableau Kanban principal :** Affichez ou masquez d'un clic un tableau Kanban complet directement à la place de votre liste de messages Gmail. Le design s'intègre harmonieusement (fond `#f6f8fc`, colonnes gris doux `#f0f4f9`, cartes blanches aux bordures épurées).
* **Bouton sidebar anti-doublons :** Le bouton d'accès au tableau est injecté en tant que frère direct au-dessus du bloc des dossiers de Gmail (`.ajl`), ce qui neutralise à 100% les bugs de dossiers dupliqués ou triplés causés par les mises à jour des compteurs de messages non lus de Gmail.
* **Ouverture en plein écran :** Un bouton dédié permet d'ouvrir le tableau dans un onglet Chrome indépendant, idéal pour un usage sur un second écran.

### 2. Architecture "serverless" & 100% privée
* **Google Tasks comme base de données :** Aucune base de données ou serveur externe requis ! L'intégralité de vos listes, colonnes, tâches et liens Gmail sont sérialisés au format JSON et stockés de façon sécurisée directement dans le champ description (*notes*) de vos tâches Google Tasks officielles. Le bloc de métadonnées est automatiquement repoussé hors de l'écran afin de ne pas polluer l'affichage dans l'application Google Tasks standard.
* **Zéro frais, zéro latence :** Une architecture conçue pour évoluer gratuitement à l'infini.
* **Confidentialité totale :** Vos données transitent exclusivement de manière sécurisée entre votre navigateur et les serveurs officiels de Google. Aucun tiers n'a accès à vos e-mails ou à vos tâches.
* **Cache local intelligent :** Un cache de 30 secondes évite les appels réseau redondants et rend l'interface quasi-instantanée lors de navigations rapides.

### 3. Fonctionnalités Kanban avancées
* **Glisser-déposer (drag & drop) fluide :** Glissez vos cartes entre les colonnes *À faire*, *En cours* et *Terminé* avec des effets visuels d'insertion soignés.
* **Éditeur de détails contextuel :** Modifiez les titres, descriptions, échéances et étiquettes depuis un panneau coulissant. Si une tâche est issue d'un e-mail, un lien direct cliquable permet de rouvrir instantanément cet e-mail dans Gmail.
* **Sous-tâches interactives :** Ajoutez, modifiez et cochez des sous-tâches directement depuis l'éditeur, avec une barre de progression dynamique sur chaque carte. Le bouton "Ajouter" reste grisé tant qu'aucun texte n'est saisi.
* **Archivage des tâches terminées :** Un bouton dédié permet d'archiver en masse toutes les tâches de la colonne *Terminé* pour garder le tableau épuré.
* **Mode "Objectifs du jour" (smart view) :** Une vue chronologique épurée pour voir immédiatement vos priorités planifiées pour *Aujourd'hui* et *Cette semaine*.
* **Mode hors-ligne :** En cas de perte de connexion, l'extension bascule automatiquement sur le dernier cache connu et vous en informe clairement via le badge de statut.

### 4. ⌨️ Raccourcis clavier de productivité
Pour naviguer à la vitesse de la pensée, les raccourcis clavier suivants s'intègrent de façon fluide en respectant votre saisie textuelle ordinaire :
* **`Alt + K` (global Gmail) :** Ouvre ou referme instantanément le tableau Kanban.
* **`N` ou `n` (Kanban actif) :** Crée une nouvelle tâche et l'ouvre dans l'éditeur (se désactive automatiquement si vous écrivez dans un formulaire).
* **`Escape` (Kanban actif) :** Ferme le panneau d'édition ou le toast de capture d'e-mail.
* **`Alt + T` (Kanban actif) :** Bascule instantanément entre l'onglet **Tableau Kanban** et l'onglet **Objectifs du jour**.

---

## 📂 Structure du projet

```text
├── src/                  # 🛠️ Code source modulaire (ES Modules)
│   ├── parser.js         # Sérialisation et désérialisation du JSON de métadonnées
│   ├── observer.js       # MutationObserver Gmail throttled (100ms max)
│   ├── dom-injector.js   # Injection du bouton sidebar dans la navigation Gmail
│   ├── kanban-ui.js      # Contrôleur d'interface et état global (Shadow DOM)
│   ├── content.js        # Point d'entrée principal injecté dans Gmail
│   └── sidepanel.js      # Contrôleur autonome du panneau latéral
│
├── manifest.json         # Déclare l'extension, permissions et OAuth2
├── background.js         # Service worker en arrière-plan (authentification, relais de messages & ouverture d'onglets)
├── content.js            # [Compilé] Script de contenu Gmail généré par esbuild
├── sidepanel.js          # [Compilé] Panneau latéral autonome généré par esbuild
├── sidepanel.html        # Structure HTML du panneau latéral autonome
├── kanban-embed.css      # Design system complet conforme à Material 3
└── package.json          # Scripts de build (esbuild) et tests (Vitest)
```

---

## 🛠️ Fonctionnement du stockage décentralisé

Pour stocker les métadonnées du Kanban (statuts de colonnes, étiquettes, liens Gmail) sans serveur, le module [parser.js](src/parser.js) utilise un délimiteur hermétique pour encapsuler un JSON dans la description d'une tâche. Ce bloc est repoussé hors de la zone visible de l'application Google Tasks standard grâce à un padding de lignes vides.

```text
[Ceci est la description rédigée librement par l'utilisateur]




[... lignes vides pour masquer le bloc ci-dessous ...]

--- KANBAN_METADATA ---
{
  "columnId": "inprogress",
  "tags": ["Urgent", "Projet A"],
  "gmailId": "18bc00f73a3c26b9",
  "gmailSubject": "Demande de devis - Application Web",
  "gmailUrl": "https://mail.google.com/mail/u/0/#inbox/18bc00f73a3c26b9"
}
```

> ⚠️ **Règle d'or :** Ne jamais modifier ou supprimer manuellement le bloc `--- KANBAN_METADATA ---` depuis l'application mobile Google Tasks. Cela ferait perdre les étiquettes et l'état de la colonne à la tâche concernée.

* **Avantage synchro mobile :** Si vous cochez une tâche comme "Terminée" sur l'application mobile Google Tasks officielle (iOS/Android), elle passera automatiquement dans la colonne *Terminé* de votre Kanban Gmail lors de votre prochaine ouverture.

---

## 💻 Installation locale & développement

### Étape 1 : Activer le mode développeur sur Chrome
1. Ouvrez Google Chrome et accédez à `chrome://extensions/`.
2. Activez le **mode développeur** à l'aide de l'interrupteur situé en haut à droite.

### Étape 2 : Configurer le code source
1. Clonez ou téléchargez le dépôt.
2. Installez les dépendances NPM :
   ```bash
   npm install
   ```
3. Lancer la compilation à l'aide des scripts fournis :
   * **En continu (watch) :** `npm run watch` (recompile vos modifications à chaque sauvegarde).
   * **Production (build) :** `npm run build` (génère les bundles minifiés et optimisés).
4. Pour valider l'intégrité du parser de métadonnées, exécutez les tests unitaires :
   ```bash
   npm run test
   ```

### Étape 3 : Charger l'extension
1. Cliquez sur **Charger l'extension non empaquetée** en haut à gauche.
2. Sélectionnez le dossier racine `Kanban Task` contenant le `manifest.json`.

### Étape 4 : Configurer vos identifiants OAuth2
1. Copiez l'ID d'extension généré par Chrome sur la carte de l'extension (ex : `abcdefgh...`).
2. Rendez-vous sur votre [Google Cloud Console](https://console.cloud.google.com/).
3. Créez des identifiants **ID de client OAuth** de type **Application Chrome** et collez votre ID d'extension dans le champ correspondant.
4. Activez la **Google Tasks API** sur votre projet Cloud.
5. Copiez le `client_id` obtenu et collez-le dans le fichier `manifest.json` à la ligne correspondante.
6. Rechargez l'extension dans `chrome://extensions/`.

---

## 🧪 Guide d'utilisation
1. Lancez ou actualisez votre onglet Gmail (**Cmd + Shift + R**).
2. Un bouton **Tableau Kanban** apparaît dans votre navigation de gauche. Cliquez dessus pour déployer l'interface (ou utilisez le raccourci **Alt + K**).
3. Utilisez le menu déroulant en haut à gauche du tableau pour naviguer entre vos différentes listes Google Tasks. La liste se rafraîchit automatiquement toutes les 30 secondes.
4. Cliquez sur l'icône de plein écran (↗) pour ouvrir le tableau dans un onglet Chrome indépendant.

---
<p align="center"><a href="https://faucheux.bzh" target="_blank" style="color: inherit; text-decoration: none;">&lt;&gt; par Fabrice Faucheux</a></p>

---

## 🇬🇧 English Version

A cutting-edge Google Chrome extension (Manifest V3) that transforms Gmail into a powerful, visual, and decentralised productivity tool.

Through a seamless, non-intrusive integration with Gmail's DOM, **Kanban Tasks** embeds a fully reactive Kanban board — styled to match **Google Material 3** — directly into Gmail's main pane, with the option to open it in a side panel or a dedicated tab.

---

## 🌟 Features & innovations

### 1. Direct & invisible Gmail integration
* **Main Kanban board:** Show or hide a full Kanban board with a single click, replacing your Gmail message list. The design blends in naturally (background `#f6f8fc`, soft grey columns `#f0f4f9`, clean white cards).
* **Sidebar button (no duplicates):** The access button is injected as a direct sibling above Gmail's folder block (`.ajl`), completely eliminating the label-duplication bug caused by Gmail's unread-count updates.
* **Full-screen mode:** A dedicated button opens the board in a standalone Chrome tab — perfect for use on a second monitor.

### 2. Serverless architecture & 100% private
* **Google Tasks as a database:** No external database or server required. All lists, columns, tasks, and Gmail links are serialised as JSON and stored securely in the *notes* field of your official Google Tasks. The metadata block is automatically pushed out of the visible area so it doesn't clutter the standard Google Tasks app.
* **Zero cost, zero latency:** An architecture designed to scale indefinitely for free.
* **Total privacy:** Your data flows exclusively and securely between your browser and Google's official servers. No third party has access to your emails or tasks.
* **Smart local cache:** A 30-second cache eliminates redundant network requests and makes the interface feel near-instant during quick navigation.

### 3. Advanced Kanban features
* **Smooth drag & drop:** Drag cards between the *To do*, *In progress*, and *Done* columns with polished visual feedback.
* **Contextual task editor:** Edit titles, descriptions, due dates, and labels from a slide-in panel. If a task originated from an email, a clickable link lets you reopen that email in Gmail instantly.
* **Interactive subtasks:** Add, edit, and check off subtasks directly from the editor, with a live progress bar on each card. The "Add" button stays greyed out until text is entered.
* **Archive done tasks:** A dedicated button lets you bulk-archive all tasks in the *Done* column to keep the board clean.
* **"Objectives for today" mode (smart view):** A streamlined chronological view showing your scheduled priorities for *Today* and *This week*.
* **Offline mode:** When the connection drops, the extension automatically falls back to the last known cache and clearly notifies you via the status badge.

### 4. ⌨️ Keyboard shortcuts
The following shortcuts integrate smoothly without interfering with normal text input:
* **`Alt + K` (global Gmail):** Open or close the Kanban board instantly.
* **`N` or `n` (Kanban active):** Create a new task and open it in the editor (automatically disabled when typing in a form field).
* **`Escape` (Kanban active):** Close the task editor or the email capture toast.
* **`Alt + T` (Kanban active):** Toggle between the **Kanban board** tab and the **Objectives for today** tab.

> **macOS note:** `Alt` corresponds to the `⌥ Option` key. All shortcuts use `e.code` internally, so they work regardless of the OS keyboard layout.

---

## 📂 Project structure

```text
├── src/                  # 🛠️ Modular source code (ES Modules)
│   ├── parser.js         # Metadata JSON serialisation & deserialisation
│   ├── observer.js       # Throttled Gmail MutationObserver (100ms max)
│   ├── dom-injector.js   # Sidebar button injection into Gmail navigation
│   ├── kanban-ui.js      # UI controller & global state (Shadow DOM)
│   ├── content.js        # Main entry point injected into Gmail
│   └── sidepanel.js      # Standalone side-panel controller
│
├── manifest.json         # Extension declaration, permissions & OAuth2
├── background.js         # Background service worker (auth, message relay & tab opening)
├── content.js            # [Compiled] Gmail content script generated by esbuild
├── sidepanel.js          # [Compiled] Standalone side panel generated by esbuild
├── sidepanel.html        # Side panel HTML structure
├── kanban-embed.css      # Complete design system based on Material 3
└── package.json          # Build (esbuild) & test (Vitest) scripts
```

---

## 🛠️ How decentralised storage works

To store Kanban metadata (column states, labels, Gmail links) without any server, the [parser.js](src/parser.js) module uses a hermetic delimiter to embed a JSON block inside the task's notes field. This block is pushed far below the visible area using blank-line padding so it stays hidden in the standard Google Tasks app.

```text
[User-written description goes here]




[... blank lines to hide the block below ...]

--- KANBAN_METADATA ---
{
  "columnId": "inprogress",
  "tags": ["Urgent", "Project A"],
  "gmailId": "18bc00f73a3c26b9",
  "gmailSubject": "Quote request - Web application",
  "gmailUrl": "https://mail.google.com/mail/u/0/#inbox/18bc00f73a3c26b9"
}
```

> ⚠️ **Golden rule:** Never manually edit or delete the `--- KANBAN_METADATA ---` block from the Google Tasks mobile app. Doing so will cause the task to lose its labels and column state.

* **Mobile sync benefit:** If you tick a task as "Completed" in the official Google Tasks mobile app (iOS/Android), it will automatically move to the *Done* column in your Gmail Kanban on next load.

---

## 💻 Local installation & development

### Step 1: Enable developer mode in Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.

### Step 2: Set up the source code
1. Clone or download the repository.
2. Install NPM dependencies:
   ```bash
   npm install
   ```
3. Build using the provided scripts:
   * **Watch mode (continuous):** `npm run watch` (rebuilds on every save).
   * **Production build:** `npm run build` (generates minified, optimised bundles).
4. To validate the metadata parser, run the unit tests:
   ```bash
   npm run test
   ```

### Step 3: Load the extension
1. Click **Load unpacked** in the top-left corner.
2. Select the root `Kanban Task` folder containing `manifest.json`.

### Step 4: Configure your OAuth2 credentials
1. Copy the extension ID generated by Chrome (e.g. `abcdefgh...`).
2. Go to your [Google Cloud Console](https://console.cloud.google.com/).
3. Create an **OAuth client ID** of type **Chrome app** and paste your extension ID in the corresponding field.
4. Enable the **Google Tasks API** on your Cloud project.
5. Copy the `client_id` and paste it into `manifest.json` at the relevant line.
6. Reload the extension in `chrome://extensions/`.

---

## 🧪 Usage guide
1. Launch or refresh your Gmail tab (**Cmd + Shift + R** on macOS).
2. A **Tableau Kanban** button appears in your left-hand navigation. Click it to open the interface (or use the **Alt + K** shortcut).
3. Use the dropdown menu at the top-left of the board to switch between your Google Tasks lists. The list refreshes automatically every 30 seconds.
4. Click the full-screen icon (↗) to open the board in a standalone Chrome tab.

---
<p align="center"><a href="https://faucheux.bzh" target="_blank" style="color: inherit; text-decoration: none;">&lt;&gt; par Fabrice Faucheux</a></p>