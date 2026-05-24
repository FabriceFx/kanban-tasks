# Fiche du Chrome Web Store — Kanban Tasks

> Dernière mise à jour : 2026-05-23

Ce document regroupe toutes les informations, descriptions, justifications et assets nécessaires pour publier l'extension **Kanban Tasks** sur le Chrome Web Store. Vous pouvez copier-coller ces informations directement dans le tableau de bord développeur Google Chrome (Chrome Developer Dashboard).

---

## 📝 Informations de la Fiche du Store

### **Nom de l'extension** (Extension Name) [REQUIS]
*Doit correspondre exactement au `name` dans `manifest.json` (max 75 caractères).*
> **Kanban Tasks**

### **Description Courte** (Short Description) [REQUIS]
*Max 132 caractères. S'affiche dans les résultats de recherche et les tuiles promotionnelles.*
> **Transformez vos listes Google Tasks en tableaux Kanban visuels dans Gmail pour gérer vos tâches sans effort.**

### **Description Détaillée** (Detailed Description) [REQUIS]
*Max 16 000 caractères. Le Chrome Web Store supprime tout formatage Markdown. Voici les versions plain-text prêtes à copier (Français et Anglais).*

#### 🇫🇷 Version Française (Description de la fiche principale)
```
Kanban Tasks — Boostez votre productivité en transformant vos tâches Google Tasks en un magnifique tableau Kanban visuel directement intégré dans Gmail ou dans un panneau latéral dédié.

Gérez vos projets et organisez votre flux de travail sans aucun serveur externe. Kanban Tasks s'appuie directement et de manière 100% sécurisée sur l'API officielle Google Tasks pour conserver toutes vos données synchronisées, que vous soyez sur votre ordinateur ou sur votre application mobile.

FONCTIONNALITÉS CLÉS
• Intégration Gmail Directe : Un panneau latéral rétractable s'intègre parfaitement dans votre interface Gmail sans perturber votre travail.
• Panneau Latéral Autonome : Ouvrez l'extension en plein écran dans un onglet dédié ou utilisez le panneau latéral pour travailler confortablement.
• Zéro Latence (UI Optimiste) : Les glisser-déposer de cartes et les sauvegardes sont instantanés. L'application enregistre immédiatement vos modifications et synchronise les serveurs de Google en tâche de fond. En cas d'erreur réseau, un rollback automatique préserve la cohérence de vos données.
• Gestion Avancée des Sous-tâches : Ajoutez, cochez, renommez ou supprimez des sous-tâches directement depuis le panneau d'édition. Suivez leur avancement en un coup d'œil grâce aux micro-barres de progression animées sur les cartes.
• Archivage Intelligent : Libérez de la mémoire et accélérez l'affichage en archivant en un clic toutes les tâches terminées de votre colonne "Terminé". Elles restent en sécurité dans Google Tasks mais n'encombrent plus votre tableau Kanban.
• Liaison d'E-mails : Associez un e-mail Gmail à une tâche en un clic pour y revenir instantanément plus tard grâce au Deep Linking Gmail.

COMMENT L'UTILISER
1. Cliquez sur l'icône de l'extension dans votre barre d'outils Chrome pour ouvrir l'interface.
2. Connectez-vous de manière sécurisée avec votre compte Google (OAuth2 direct).
3. Vos listes de tâches existantes sont automatiquement importées sous forme de colonnes (À faire, En cours, Terminé).
4. Glissez-déposez vos cartes pour changer leur état, ou cliquez sur une carte pour modifier ses détails et ses sous-tâches.
5. Dans Gmail, ouvrez n'importe quel e-mail et cliquez sur le bouton "Ajouter au Kanban" pour créer une tâche liée.

SÉCURITÉ & CONFIDENTIALITÉ
• Vos données vous appartiennent. L'extension ne transmet aucune information à des serveurs tiers. Tout transite exclusivement via les connexions sécurisées de Google (OAuth2).
• Le stockage local (chrome.storage) est uniquement utilisé pour la mise en cache afin de vous garantir une fluidité absolue.

SUPPORT
Une question ? Un bug à signaler ?
Contactez notre équipe support à l'adresse support@kanban-tasks.io ou ouvrez un ticket sur notre page GitHub.
```

#### 🇬🇧 Version Anglaise (Pour cibler un public international)
```
Kanban Tasks — Boost your productivity by transforming your Google Tasks lists into a beautiful, visual Kanban board directly integrated inside Gmail or a dedicated side panel.

Manage your projects and streamline your workflow with zero external servers. Kanban Tasks safely relies on the official Google Tasks API to keep all your tasks in sync across all your devices, including your mobile Google Tasks app.

KEY FEATURES
• Integrated Gmail Panel: A collapsible side panel integrates perfectly into Gmail without cluttering your inbox layout.
• Standalone View: Open the Kanban board in a full tab or side panel to manage your tasks comfortably.
• Zero Latency (Optimistic UI): Drag & drop cards and save task details instantly. The app updates your UI immediately while syncing with Google in the background. Visual rollback is triggered automatically if syncing fails.
• Subtask Management: Add, toggle, edit, or delete subtasks directly inside the task editor. Track progress instantly with beautiful micro-progress bars on each card.
• Smart Archiving: Keep your boards clean and fast. Archive completed tasks in bulk with a single click. They remain safe in Google Tasks but won't slow down your board.
• Email Linking: Click "Add to Kanban" inside any Gmail thread to create a task linked to that email.

HOW TO USE
1. Click the extension icon in your Chrome toolbar to open the application.
2. Sign in securely with your Google account (direct secure OAuth2 authorization).
3. Your active Google Tasks lists will immediately load as Kanban cards across columns (To Do, In Progress, Done).
4. Drag and drop cards to change status, or click a card to edit description, subtasks, or tags.
5. In Gmail, open any email and click the "Add to Kanban" button to create a linked task.

PRIVACY & SECURITY
• Your data stays yours. This extension never uploads your tasks or emails to any third-party server. All operations are securely routed directly through Google's APIs.
• Local storage is only used as a high-performance cache to ensure absolute fluid interactions.

SUPPORT
Questions or issues?
Contact us at support@kanban-tasks.io or open a ticket on our GitHub repository.
```

### **Catégorie** (Category) [REQUIS]
> **Productivité** (Productivity)

### **Objectif Unique** (Single Purpose) [REQUIS]
*Une seule phrase décrivant la fonction principale de l'extension de manière précise.*
> **Transforme vos listes de tâches Google Tasks en tableaux Kanban visuels intégrés directement dans l'interface Gmail et en panneau latéral.**

### **Langue Principale** (Primary Language) [REQUIS]
> **Français (French)**

---

## 🎨 Assets Graphiques

| Asset | Dimensions | Statut | Fichier Source / Recommandations |
| :--- | :--- | :--- | :--- |
| **Icône du Store** [REQUIS] | 128×128 PNG | ✅ Prêt | [icon128.png](file:///Users/fabrice/Documents/Mes%20d%C3%A9veloppements/Kanban%20Task/icons/icon128.png) |
| **Capture d'écran 1** [REQUIS] | 1280×800 (ou 640×400) | 🟡 À générer | Tableau Kanban imbriqué dans Gmail avec cartes colorées, badges et barre de progression. |
| **Capture d'écran 2** [RECOMMANDÉ] | 1280×800 (ou 640×400) | 🟡 À générer | Vue en plein écran dans un onglet avec le tableau Kanban complet. |
| **Capture d'écran 3** [RECOMMANDÉ] | 1280×800 (ou 640×400) | 🟡 À générer | Éditeur de tâche ouvert montrant la gestion interactive des sous-tâches. |
| **Tuile Promotionnelle** | 440×280 PNG | 🟡 À générer | Visuel premium avec le logo "Kanban Tasks" sur fond dégradé moderne. |

---

## 🔑 Justification des Permissions (manifest.json)

*Google exige une explication claire et rédigée en langage simple pour chaque permission demandée par l'extension.*

| Permission | Type | Justification pour l'équipe de revue Google |
| :--- | :--- | :--- |
| `identity` | permissions | Nécessaire pour authentifier l'utilisateur de manière sécurisée auprès de son compte Google via OAuth2, afin de lire et mettre à jour ses listes de tâches Google Tasks sans serveur intermédiaire tiers. |
| `storage` | permissions | Utilisé pour stocker un cache local des tâches et leurs métadonnées associées (ordre, colonnes Kanban, sous-tâches, archivage). Cela permet à l'extension d'offrir une interface réactive instantanée (UI optimiste) et de fonctionner en mode dégradé hors-ligne. |
| `https://mail.google.com/*` | host_permissions (matches) | Requis pour pouvoir injecter le script de contenu (`content.js`) et la feuille de style dans l'interface Gmail, permettant d'afficher le panneau Kanban imbriqué et le bouton "Ajouter au Kanban" dans la barre d'outils des e-mails. |

---

## 🔒 Confidentialité & Utilisation des Données

*Déclarations requises pour le formulaire de divulgation des données du Chrome Web Store.*

### Collecte de Données
**L'extension collecte-t-elle des données utilisateur ?** **NON**

| Type de Donnée | Collectée ? | Transmise hors de l'appareil ? | Finalité | Partagée avec des tiers ? |
| :--- | :--- | :--- | :--- | :--- |
| Infos personnelles identifiables | **Non** | Non | N/A | Non |
| Informations d'authentification | **Non** | Oui (Uniquement à Google via l'API officielle) | Connexion directe et sécurisée pour accéder à Google Tasks. | Non |
| Communications personnelles | **Non** | Non | N/A | Non |
| Contenu des sites web | **Non** | Non | N/A | Non |

### Certifications d'Utilisation des Données [TOUT COCHER]
- [x] Les données ne sont **JAMAIS** vendues ou louées à des tiers.
- [x] Les données ne sont **JAMAIS** utilisées pour des finalités étrangères aux fonctionnalités principales de l'extension (publicité, ciblage, etc.).
- [x] Les données ne sont **JAMAIS** utilisées pour évaluer la solvabilité ou à des fins de prêt.

---

## 📄 Politique de Confidentialité (Privacy Policy Draft)

*À héberger sur une URL publique stable (par exemple : GitHub Pages de votre dépôt, Google Sites ou Notion public).*

```markdown
# Politique de Confidentialité — Kanban Tasks

Dernière mise à jour : 23 mai 2026

L'extension **Kanban Tasks** s'engage à respecter la vie privée de ses utilisateurs. Cette politique de confidentialité détaille la manière dont l'extension gère vos données.

### 1. Collecte et Stockage des Données
L'extension **Kanban Tasks** ne possède aucun serveur externe et ne collecte, ne stocke ni ne transmet aucune donnée personnelle ou de navigation en dehors de votre appareil.
* **Google Tasks API** : L'extension interagit directement et de manière sécurisée avec l'API officielle Google Tasks pour lire et mettre à jour vos listes de tâches. Toutes les requêtes d'authentification et de synchronisation s'effectuent directement entre votre navigateur et les serveurs de Google (via le protocole sécurisé HTTPS / OAuth2).
* **Mise en cache locale** : Pour offrir une expérience utilisateur fluide et sans latence (UI optimiste), l'extension met en cache vos données de tâches dans le stockage de votre navigateur (`chrome.storage.local`). Ces données restent confinées dans le bac à sable (sandbox) sécurisé de l'extension sur votre ordinateur.

### 2. Permissions requises et Utilisation
* **`identity`** : Utilisé exclusivement pour obtenir un jeton d'accès sécurisé via votre compte Google connecté afin d'interagir avec vos tâches Google Tasks.
* **`storage`** : Utilisé exclusivement pour mettre en cache l'état visuel du Kanban (tâches, colonnes, sous-tâches, paramètres) afin de garantir un affichage instantané.
* **Accès au site `https://mail.google.com/*`** : Requis uniquement pour injecter l'interface visuelle du Kanban sous forme d'un panneau latéral repliable et d'ajouter le bouton de raccourci "Ajouter au Kanban" dans l'interface Gmail. Aucune donnée d'e-mail n'est collectée ou transmise à des tiers.

### 3. Partage des Données avec des Tiers
Aucune donnée utilisateur ou de tâche n'est partagée, vendue, louée ou transmise à des entreprises ou serveurs tiers. L'intégralité du traitement s'effectue localement sur votre ordinateur et en liaison directe avec l'API Google officielle.

### 4. Vos Droits et Contrôle
Toutes les données stockées dans le cache de votre navigateur peuvent être supprimées à tout moment :
* En vous déconnectant de l'extension via le bouton de déconnexion.
* En désinstallant l'extension de Google Chrome.
* En vidant le cache local ou les données d'extension dans les paramètres de Chrome.

### 5. Contact
Pour toute question relative à cette politique de confidentialité ou à la gestion de vos données, vous pouvez nous contacter par e-mail à : **support@kanban-tasks.io**
```

---

## 🚀 Historique des Versions

| Version | Date | Description des Changements | Statut |
| :--- | :--- | :--- | :--- |
| **1.0.0** | 2026-05-23 | • Première version de production stable.<br>• Tableau Kanban Gmail complet via Shadow DOM.<br>• Panneau latéral autonome et réactif.<br>• Synchronisation optimiste à zéro latence avec rollback automatique en cas d'erreur réseau.<br>• Gestion dynamique complète et visuelle des sous-tâches.<br>• Bouton d'archivage en bloc de la colonne Terminé pour optimiser la mémoire. | **Brouillon (Draft)** |

---

## 🛠️ Notes de Revue pour le Développeur

### 📌 Configuration OAuth2 en Production (Très Important)
Lors du passage de l'extension en production sur le Chrome Web Store, l'ID d'extension local (32 lettres) va changer pour devenir l'ID définitif attribué par Google sur le Store.
Pour éviter de casser l'authentification OAuth2 :
1. Publiez d'abord l'extension en mode **Privé** ou **Non répertorié** sur le tableau de bord développeur.
2. Notez l'ID définitif fourni par le dashboard (ex: `abcdefghijklmnopqrstuvwxyzabcdef`).
3. Créez un nouvel identifiant client OAuth de type **Application Chrome** dans votre console Google Cloud en renseignant cet ID de store définitif.
4. Mettez à jour le champ `"client_id"` dans `manifest.json` avec la nouvelle clé obtenue.
5. Publiez une mise à jour mineure (ex: `1.0.1`) contenant ce manifest mis à jour.
6. L'authentification OAuth2 fonctionnera alors de manière fluide et transparente pour tous vos utilisateurs de production !
