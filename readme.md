# **Kanban Tasks - Gmail Edition**

Une extension Google Chrome (Manifest V3) ultra-moderne qui transforme l'interface de Gmail en un puissant outil de productivité visuel et décentralisé. 

Grâce à une intégration invisible et respectueuse du DOM de Gmail, **Kanban Tasks** injecte un tableau Kanban complet et hautement réactif conforme à la charte graphique de **Google Material 3** directement dans la zone principale de Gmail, tout en offrant la possibilité de l'ouvrir dans un panneau latéral ou un onglet dédié.

---

## **🌟 Caractéristiques & Innovations**

### 1. **Intégration Gmail Directe & Invisible**
* **Tableau Kanban Principal :** Affichez ou masquez d'un clic un tableau Kanban complet directement à la place de votre liste de messages Gmail. Le design s'intègre harmonieusement (fond `#f6f8fc`, colonnes gris doux `#f0f4f9`, cartes blanches aux bordures épurées).
* **Bouton Sidebar Anti-Doublons :** Le bouton d'accès au tableau est injecté en tant que frère direct au-dessus du bloc des dossiers de Gmail (`.ajl`), ce qui neutralise à 100% les bugs de dossiers dupliqués ou triplés causés par les mises à jour des compteurs de messages non lus de Gmail.
* **Bouton "Ajouter au Kanban" Ultra-Discret :** Une icône circulaire fine (`#444746`) s'intègre naturellement en tête de la barre d'outils de chaque e-mail ouvert. Elle bénéficie d'une micro-animation premium au survol (fond gris doux) et au clic (fond et icône bleus avec un léger effet de zoom `scale(1.15)` durant 2 secondes pour confirmer l'ajout).

### 2. **Architecture "Serverless" & 100% Privée**
* **Google Tasks comme Base de Données :** Aucune base de données ou serveur externe requis ! L'intégralité de vos listes, colonnes, tâches et liens Gmail sont sérialisés au format JSON et stockés de façon sécurisée directement dans le champ description (*Notes*) de vos tâches Google Tasks officielles.
* **Zéro Frais, Zéro Latence :** Une architecture conçue pour évoluer gratuitement à l'infini.
* **Confidentialité Totale :** Vos données transitent exclusivement de manière sécurisée entre votre navigateur et les serveurs officiels de Google. Aucun tiers n'a accès à vos e-mails ou à vos tâches.

### 3. **Fonctionnalités Kanban Avancées**
* **Glisser-Déposer (Drag & Drop) Fluide :** Glissez vos cartes entre les colonnes *À faire*, *En cours* et *Terminé* avec des effets visuels d'insertion soignés.
* **Éditeur de Détails Gmail Contextuel :** Modifiez les titres, descriptions, échéances et étiquettes depuis un panneau coulissant à droite. Si une tâche est issue d'un e-mail, un lien direct cliquable permet de rouvrir instantanément cet e-mail dans Gmail.
* **Mode "Objectif Travail" (Smart View) :** Une vue chronologique épurée pour voir immédiatement vos priorités planifiées pour *Aujourd'hui* et *Cette semaine*.

---

## **📂 Structure du Projet**

```text
├── manifest.json         # Déclare l'extension, les permissions OAuth2 et l'architecture
├── background.js          # Service worker en arrière-plan (authentification & relais de messages)
├── content.js             # Injection sécurisée dans Gmail (Shadow DOM, MutationObserver robuste)
├── kanban-embed.css       # Design System complet conforme à Material 3 (Shadow DOM)
├── parser.js              # Module de sérialisation/désérialisation du JSON de métadonnées
├── sidepanel.html         # Point d'entrée de la vue plein écran / panneau latéral
├── sidepanel.js           # Contrôleur visuel de la vue autonome
└── icons/                 # Ressources graphiques officielles de l'extension
```

---

## **🛠️ Fonctionnement du Stockage Décentralisé**

Pour stocker les métadonnées de notre Kanban (statuts de colonnes, étiquettes, liens Gmail) sans serveur, le module [parser.js](file:///Users/fabrice/Documents/Mes%20développements/Kanban%20Task/parser.js) utilise un délimiteur hermétique pour encapsuler un JSON dans la description d'une tâche :

```text
[Ceci est la description rédigée librement par l'utilisateur]

--- KANBAN_METADATA ---
{
  "columnId": "inprogress",
  "tags": ["Urgent", "Projet A"],
  "gmailId": "18bc00f73a3c26b9",
  "gmailSubject": "Demande de devis - Application Web",
  "gmailUrl": "https://mail.google.com/mail/u/0/#inbox/18bc00f73a3c26b9"
}
```

* **Avantage Synchro Mobile :** Si vous cochez une tâche comme "Terminée" sur l'application mobile Google Tasks officielle (iOS/Android), elle passera automatiquement dans la colonne *Terminé* de votre Kanban Gmail lors de votre prochaine ouverture.

---

## **💻 Installation Locale & Développement**

### **Étape 1 : Activer le Mode Développeur sur Chrome**
1. Ouvrez Google Chrome et accédez à `chrome://extensions/`.
2. Activez le **Mode développeur** à l'aide de l'interrupteur situé en haut à droite.

### **Étape 2 : Charger l'extension**
1. Cliquez sur **Charger l'extension non empaquetée** en haut à gauche.
2. Sélectionnez le dossier contenant l'ensemble de ces fichiers.

### **Étape 3 : Configurer vos identifiants OAuth2**
1. Copiez l'ID d'extension généré par Chrome sur la carte de l'extension (ex: `abcdefgh...`).
2. Rendez-vous sur votre [Google Cloud Console](https://console.cloud.google.com/).
3. Créez des identifiants **ID de client OAuth** de type **Application Chrome** et collez votre ID d'extension dans le champ correspondant.
4. Activez la **Google Tasks API** sur votre projet Cloud.
5. Copiez le `client_id` obtenu et collez-le dans le fichier `manifest.json` à la ligne correspondante.
6. Rechargez l'extension dans `chrome://extensions/`.

---

## **🧪 Guide d'utilisation**
1. Lancez ou actualisez votre onglet Gmail (**Cmd + Shift + R**).
2. Un bouton **Tableau Kanban** apparaît dans votre navigation de gauche. Cliquez dessus pour déployer l'interface.
3. Ouvrez n'importe quel e-mail : cliquez sur le **bouton circulaire Kanban** dans la barre d'outils Gmail pour le transformer instantanément en tâche active.