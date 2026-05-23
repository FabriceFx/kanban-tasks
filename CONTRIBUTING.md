# Guide de Contribution - Kanban Tasks

Merci de l'intérêt que vous portez au développement de **Kanban Tasks - Gmail Edition** ! Ce guide est conçu pour vous aider à comprendre l'architecture du projet, configurer votre environnement de développement local et soumettre des contributions de haute qualité.

---

## 🏗️ Architecture & Organisation du Projet

Le projet utilise une architecture modulaire moderne avec **ES Modules** compilés à l'aide d'**esbuild**. Le code source est séparé par responsabilité au sein du dossier `src/` et compilé sous forme de bundles optimisés et minifiés à la racine de l'extension pour être lu directement par Google Chrome.

### Structure des dossiers

```text
├── src/                      # 🛠️ CODE SOURCE (fichiers de développement)
│   ├── parser.js             # Logique hermétique de sérialisation / désérialisation du JSON de métadonnées
│   ├── observer.js           # MutationObserver Gmail optimisé (throttled à 100ms max)
│   ├── dom-injector.js       # Injection sécurisée d'éléments DOM (boutons sidebar, icône d'e-mail ouvert)
│   ├── kanban-ui.js          # Rendu et état de l'application dans le Shadow DOM Gmail
│   ├── content.js            # Point d'entrée principal du script de contenu Gmail
│   └── sidepanel.js          # Contrôleur autonome du panneau latéral (TailwindCSS)
│
├── manifest.json             # Fichier de manifeste Manifest V3 officiel
├── background.js             # Service worker Chrome d'arrière-plan (OAuth2 & relais API)
├── kanban-embed.css          # Design System Material 3 complet pour l'iframe/Shadow DOM
├── sidepanel.html            # Structure HTML du panneau latéral
├── parser.test.js            # Suite de tests unitaires Vitest pour parser.js
│
├── package.json              # Dépendances NPM et scripts de compilation
├── LICENSE                   # Licence MIT de distribution open-source
└── readme.md                 # Documentation d'accueil du dépôt
```

> [!WARNING]
> **Ne modifiez jamais directement les fichiers `content.js` et `sidepanel.js` à la racine !** Ils sont générés automatiquement par le bundler à partir de leurs équivalents dans `src/`.

---

## 🛠️ Configuration de l'Environnement Local

Pour travailler sur le projet, vous devez disposer de **Node.js** (v16 ou supérieur) et de **npm** installés sur votre machine.

### 1. Installation des dépendances
Exécutez la commande suivante à la racine du projet pour installer les dépendances de développement (esbuild pour le bundling, Vitest pour les tests unitaires) :
```bash
npm install
```

### 2. Lancement du Bundler en mode continu (Watch)
Pour compiler vos modifications en temps réel pendant que vous écrivez du code :
```bash
npm run watch
```

### 3. Compilation optimisée pour la production (Build)
Pour compiler une version finale minifiée et optimisée de l'extension :
```bash
npm run build
```

### 4. Exécution de la suite de tests
Les tests unitaires valident le bon comportement du parser de métadonnées et la résilience aux erreurs du JSON. Lancez-les via Vitest avec :
```bash
npm run test
```

---

## 🔌 Chargement de l'Extension dans Chrome

1. Ouvrez Google Chrome et naviguez vers `chrome://extensions/`.
2. Activez le **Mode développeur** via l'interrupteur en haut à droite.
3. Cliquez sur le bouton **Charger l'extension non empaquetée** en haut à gauche.
4. Sélectionnez le dossier racine du projet `Kanban Task`.
5. Si vous modifiez le code dans `src/`, assurez-vous que `npm run watch` tourne en arrière-plan, puis cliquez sur l'icône de **rechargement** de la carte de l'extension dans Chrome.

---

## 📜 Conventions de Code & Qualité

Pour assurer la maintenabilité et la robustesse de l'extension (particulièrement face aux mises à jour fréquentes du DOM de Gmail) :

### 1. Typage JSDoc et validation stricte
Toutes les fonctions doivent être annotées avec des blocs **JSDoc** pour décrire leurs paramètres et valeurs de retour.
Toute modification apportée à `src/parser.js` doit faire l'objet d'une validation stricte via la méthode de schéma `validateMetadata` afin de s'assurer qu'aucun JSON corrompu n'altère le stockage décentralisé sur Google Tasks.

### 2. MutationObserver & performances DOM
Gmail est une application lourde avec des mutations DOM constantes. Pour éviter les gels de navigateur ou les boucles infinies de MutationObserver :
* N'utilisez pas de debounce avec effacements successifs de timers (`clearTimeout`), qui provoquent une famine d'événements (*starvation*). Utilisez notre système **throttled** configuré dans `src/observer.js` avec un intervalle maximum fixe (100ms).
* Lorsque vous modifiez ou injectez du code dans Gmail, désactivez temporairement le MutationObserver ou utilisez des drapeaux de protection synchrones réinitialisés de manière macro-temporelle (`setTimeout(..., 0)`) pour interdire les boucles infinies.

### 3. Synchronisation en temps réel inter-contextes
Le tableau Kanban embarqué dans Gmail et le panneau latéral autonome communiquent en temps réel en écoutant les modifications de `chrome.storage.local.onChanged`.
* Pour éviter des rendus répétés et redondants (qui provoqueraient des scintillements d'interface et des boucles infinies), utilisez toujours des filtres de comparaison sélective (*diffing*) avant de repeindre l'interface.

---

## ⌨️ Raccourcis Clavier Intégrés

Vos modifications de raccourcis doivent s'inscrire dans l'expérience de productivité native :
* **`Alt + K` (Gmail global)** : Affiche/masque instantanément le tableau Kanban Gmail.
* **`N` ou `n` (Kanban ou sidepanel actif)** : Crée une nouvelle tâche et l'ouvre dans l'éditeur (uniquement si l'utilisateur n'est pas en train de saisir du texte dans un formulaire).
* **`Escape` (Kanban ou sidepanel actif)** : Ferme le panneau d'édition de tâche ouvert ou le toast Gmail de capture d'e-mail (autorisé en toutes circonstances).
* **`Alt + T` (Kanban ou sidepanel actif)** : Alterne entre la vue **Tableau Kanban** et la vue **Objectif Travail** (Smart View).

Toutes vos contributions impliquant de nouveaux raccourcis clavier doivent respecter la méthode `isUserTyping()` pour dégrader gracieusement leur fonctionnement et éviter de bloquer la frappe naturelle dans les champs textuels et le compositeur d'e-mails de Gmail.
