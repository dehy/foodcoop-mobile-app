# README

## Développement

L'application Supercoop est développé en React Native. Le projet utilise les langages Typescript (TSX), CSS, Objective-C (projet iOS), et Java (projet Android).

### Onboarding

#### Pré-requis

-   [Yarn](https://yarnpkg.com/getting-started/install) - gestionnaire des librairies javascript
-   IDE de votre choix (ex. [Visual Studio Code](https://code.visualstudio.com/))

_Android_

-   [Android Studio](https://developer.android.com/studio) - environnement de développement android
-   Un appareil Android (>= 4.4)

_iOS_

-   un mac
-   [Xcode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12) - environnement de développement iOS
-   [Cocoapods](https://cocoapods.org/) - gestionnaire de dépendances iOS
-   Un appareil iOS (>= 9.0)

_Bonus (facultatif)_

-   [Genymotion](https://www.genymotion.com/download/) - simulateur android tierce-partie
-   [fastlane](https://fastlane.tools/) - automatisation de build et release

#### Commun

##### Installer les dépendances Javascript

```sh
$ yarn install
```

#### Développement Android

Suivre la documentation d'installation d'environnement: https://reactnative.dev/docs/environment-setup

Récupérer le fichier `google-services.json` auprès d'une autre développeur et le copier dans `./android/app/`.

Ouvrir ensuite le dossier `./android` avec Android Studio.

##### Dépendances natives

Tout comme pour iOS, Android nécessite des librairies natives. Elle sont gérées par Gradle (intégré à Android Studio). Ces librairies sont locales (dans node_modules/) mais doivent être installée/synchronisée. Grâce à Gradle, les versions des librairies natives sont gérées automatiquement.

##### Simulateur Android avec Genymotion (facultatif)

Une fois Genymotion installé (compte créé et identification effectuée), créer un nouveau terminal virtuel. Choisir par exemple un Samsung Galaxy S9 sous android 8.0 et laisser les paramètres par défaut.

Après installation du terminal, le démarrer. Installer ensuite les "Open GApps" (bouton en haut à droite de l'interface). Cette suite d'application nous permettra d'utiliser l'authentification Google Supercoop.

##### Périphérique Android natif

Pour pouvoir utiliser l'application en mode dev sur votre périphérique Android, vous devez le passer en mode Développeur : sur votre smartphone android, rendez-vous dans l'application Paramètres > À propos du téléphone puis tapez 10 fois sur la ligne "Numéro de build".

Dans les paramètres, aller ensuite dans la section "Options pour développeurs" et activer le "Débogage USB".

Sur votre PC, exécuter en CLI la commande `adb reverse tcp:8081 tcp8081` afin que le périphérique android puisse se connecter au serveur "Metro".

#### Développement iOS

Suivre la documentation d'installation d'environnement: https://reactnative.dev/docs/environment-setup

Ouvrir ensuite le fichier `./ios/Supercoop.xcworkspace` avec Xcode.

Récupérer le fichier `GoogleService-Info.plist` auprès d'une autre développeur et l'ajouter.

##### Dépendances natives

Tout comme pour Android, des librairies natives doivent être ajoutés au projet. Nous utilisons pour l'instant le gestionnaire de librairies `[Cocoapods](https://cocoapods.org/)`. Tout comme pour Android, elles sont disponibles localement avec les librairies Javascript (dans node_modules) mais doivent tout de même être installées/synchronisées après chaque mise à jour de librairie Javascript.

```sh
cd ios/
bundle exec pod update
```

### Mise en prod

#### Versioning

Le versioning de l'application suit la méthode [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH) où le chiffre MAJOR est fixé à 1 jusqu'à une réécriture complète de l'app.

MINOR est augmenté à chaque nouvelle fonctionnalité significative.

PATCH est augmenté à chaque mise à jour de bugs uniquement.

#### Déploiement en Beta

Le cycle de mise en prod de l'app doit systématiquement passer par une phase Beta. Chez Apple, cela s'appelle "Testflight", chez Google cela s'appelle simplement "Programme beta".

Il est possible de s'en occuper manuellement en suivant les procédures des deux plateformes.

Ou sinon, l'outil [fastlane](https://fastlane.tools/) permet d'automatiser cette tâche.

#### fastlane

Fastlane, tout comme Cocoapods (voir plus haut) est écrit en Ruby. Le gestionnaite de gems (nom des modules ruby) s'appelle `bundler`.

```sh
$ gem install bundler -NV
$ cd /path/to/sp_mobile_app
$ bundle install
$ bundle exec fastlane
```

[Documentation de fastlane](https://docs.fastlane.tools/)

### Base de donnée

#### Générer un script de migration SQL

Une entité a évolué et donc le schéma SQL aussi ? Il faut créer un nouveau script de migration SQL. Il sera créé dans `./src/migrations`.

```sh
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:run
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:generate -n '<Nom>'
```

Ajouter la classe fraîchement créée ('`<Nom><Timestamp>`') dans Database.ts, dans la méthode `createConnexion()` de la méthode `connect()`.
