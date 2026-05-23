# Guide pas-à-pas : Configuration de Google Cloud & OAuth2 pour Kanban Tasks

Ce document vous guide pas-à-pas dans la console Google Cloud pour obtenir et configurer votre `client_id` afin de tester l'extension Kanban Tasks avec votre compte Gmail personnel en toute sécurité.

---

## 📋 Phase 1 : Récupérer l'identifiant (ID) de votre extension locale

Avant d'aller sur Google Cloud, vous devez connaître l'ID unique que Google Chrome a attribué à votre extension sur votre machine :

1. Ouvrez un nouvel onglet dans Chrome et tapez l'adresse suivante : `chrome://extensions/`
2. Cochez l'interrupteur **Mode développeur** situé en haut à droite.
3. Cliquez sur le bouton **Charger l'extension non empaquetée** (en haut à gauche).
4. Sélectionnez le dossier contenant votre extension (`Kanban Task`).
5. Sur la carte de l'extension **Kanban Tasks** qui vient d'apparaître, localisez le champ **ID**.
   * Il s'agit d'une suite de 32 lettres minuscules (par exemple : `cmpmkdbcpphgbcpikbfolkjnefpaclig`).
6. Copiez cet ID, vous en aurez besoin à la **Phase 5**.

---

## 🌐 Phase 2 : Créer un projet sur Google Cloud Console

1. Ouvrez votre navigateur et accédez à la [Console Google Cloud](https://console.cloud.google.com/). Connectez-vous avec le compte `@gmail.com` que vous souhaitez utiliser pour vos tests.
2. Tout en haut à gauche, à côté du logo *Google Cloud*, cliquez sur le sélecteur de projet (s'il s'agit de votre premier accès, il indiquera peut-être *"Sélectionner un projet"*).
3. Dans la boîte de dialogue qui s'ouvre, cliquez sur le bouton **Nouveau projet** (New Project) en haut à droite.
4. Remplissez le formulaire :
   * **Nom du projet :** Saisissez `Kanban Tasks`.
   * **Zone (Organization) :** Laissez sur *Aucune organisation* (No organization).
5. Cliquez sur le bouton **Créer**. Patientez quelques secondes que le projet soit créé, puis vérifiez que vous êtes bien positionné sur ce nouveau projet (son nom doit apparaître dans le sélecteur en haut à gauche).

---

## 🔒 Phase 3 : Configurer l'Écran de Consentement OAuth

Google exige que vous configuriez l'écran d'autorisation (que vous verrez lors de votre première connexion) avant de vous délivrer des clés d'accès.

1. Dans le menu de gauche de la console Google Cloud, passez votre curseur sur **APIs et services** (APIs & Services), puis cliquez sur **Écran de consentement OAuth** (OAuth consent screen).
2. Choisissez le type d'utilisateur :
   * Cochez **Externe** (User Type: External) – obligatoire pour les comptes `@gmail.com` grand public.
   * Cliquez sur le bouton **Créer**.
3. Remplissez l'**Étape 1 : Informations sur l'application** :
   * **Nom de l'application :** Saisissez `Kanban Tasks`.
   * **Adresse e-mail d'assistance utilisateur :** Sélectionnez votre propre adresse Gmail dans le menu déroulant.
   * **Logo de l'application :** Laissez vide.
   * **Coordonnées du développeur :** Saisissez votre adresse Gmail dans le champ *Adresses e-mail*.
   * Cliquez sur **Enregistrer et continuer** (Save and Continue).
4. Remplissez l'**Étape 2 : Champs d'application (Scopes)** :
   * Cette étape définit les données auxquelles votre extension a le droit d'accéder.
   * Cliquez sur le bouton **Ajouter ou supprimer des champs d'application** (Add or Remove Scopes).
   * Dans le volet de droite qui s'ouvre, tapez `tasks` dans la zone de recherche.
   * Recherchez la ligne correspondant à l'API Google Tasks avec le champ d'application suivant :
     `.../auth/tasks` (Description : *Create, edit, organize, and delete all your tasks*).
   * Cochez la case au début de cette ligne.
   * Faites défiler vers le bas du volet de droite et cliquez sur le bouton **Mettre à jour** (Update).
   * Vérifiez que le champ `.../auth/tasks` apparaît bien dans le tableau des scopes requis, puis cliquez sur **Enregistrer et continuer**.
5. Remplissez l'**Étape 3 : Utilisateurs de test (Test Users)** :
   * **TRÈS IMPORTANT :** Tant que votre application n'est pas vérifiée par Google (ce qui n'est pas nécessaire pour un usage personnel), seul l'e-mail déclaré ici pourra se connecter.
   * Cliquez sur **+ Add Users** (+ Ajouter des utilisateurs).
   * Saisissez votre adresse `@gmail.com` exacte.
   * Cliquez sur le bouton **Ajouter** (Add), puis sur **Enregistrer et continuer**.
6. À l'étape **Résumé**, faites défiler vers le bas et cliquez sur **Revenir au tableau de bord** (Back to Dashboard).

---

## ⚡ Phase 4 : Activer l'API Google Tasks

Votre projet Google Cloud doit maintenant être autorisé à appeler les serveurs de Google Tasks.

1. Dans la barre de recherche tout en haut de la console Google Cloud, saisissez `Google Tasks API`.
2. Dans la liste des résultats, cliquez sur **Google Tasks API** (sous la catégorie *Place de marché* / *Marketplace*).
3. Cliquez sur le gros bouton bleu **Activer** (Enable).
4. Patientez quelques secondes. L'API est désormais active sur votre projet !

---

## 🔑 Phase 5 : Créer vos identifiants (Client ID) pour l'extension

1. Dans le menu de gauche, retournez dans **APIs et services** -> **Identifiants** (Credentials).
2. Cliquez sur le bouton **+ Créer des identifiants** (Create Credentials) situé en haut de la page.
3. Dans le menu déroulant, sélectionnez **ID de client OAuth** (OAuth client ID).
4. Configurez le type d'application :
   * Dans le champ **Type d'application** (Application type), sélectionnez **Application Chrome** (Chrome app).
   * **Nom :** Saisissez un nom simple, par exemple : `Kanban Client Local`.
   * **ID de l'application (Application ID) :** Collez ici l'**ID de l'extension** à 32 lettres copié à la **Phase 1** (ex : `cmpmkdbcpphgbcpikbfolkjnefpaclig`).
5. Cliquez sur le bouton **Créer**.
6. Une boîte de dialogue s'ouvre avec votre nouvel identifiant :
   * Copiez la valeur présente dans le champ **Votre ID de client** (Your Client ID).
   * Elle ressemble à ceci : `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`.
   * Cliquez sur **OK**.

---

## 📝 Phase 6 : Renseigner la clé dans le code de votre extension

1. Sur votre Mac, ouvrez le fichier `manifest.json` situé dans le dossier de votre extension.
2. Repérez le bloc `"oauth2"` à la ligne 10.
3. Remplacez le texte générique par votre ID de client copié à la phase précédente :

```json
    "oauth2": {
        "client_id": "123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
        "scopes": [
            "https://www.googleapis.com/auth/tasks"
        ]
    },
```

4. Enregistrez et fermez le fichier `manifest.json`.
5. Ouvrez Google Chrome sur la page `chrome://extensions/`.
6. Cliquez sur le bouton **Recharger** (l'icône de flèche circulaire ↻) sur la carte de votre extension **Kanban Tasks** pour charger la nouvelle configuration.

---

## 🎉 C'est prêt ! Lancez vos tests !

1. Cliquez sur l'icône de l'extension dans votre barre d'outils Chrome. L'onglet Kanban plein écran s'ouvre !
2. L'assistant détecte votre configuration et affiche un bouton **Se connecter avec Google**. Cliquez dessus.
3. Une fenêtre d'autorisation s'ouvre :
   * Sélectionnez votre compte Gmail.
   * Un écran d'avertissement de sécurité Google apparaît indiquant *"Google n'a pas validé cette application"*. C'est tout à fait normal en mode développement.
   * Cliquez sur **Paramètres avancés** (Advanced), puis tout en bas, cliquez sur le lien **Accéder à Kanban Tasks (non sécurisé)**.
   * Cochez la case pour autoriser l'accès à vos tâches Google Tasks, puis cliquez sur **Continuer** (Continue).
4. **Félicitations !** Votre tableau Kanban se charge avec vos listes de tâches réelles.
5. Allez sur votre onglet Gmail, ouvrez un e-mail et cliquez sur **« Ajouter au Kanban »** pour tester la liaison d'e-mails en temps réel !
