# README

## Développement

L'application Supercoop est développé en React Native. Le projet utilise les langages Typescript (TSX), CSS, Objective-C (projet iOS), et Java (projet Android).

### Onboarding

#### Pré-requis

- [Yarn](https://yarnpkg.com/getting-started/install) - gestionnaire des librairies javascript
- [Xcode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12) - environnement de développement iOS (uniquement sur macOS)
- [Android Studio](https://developer.android.com/studio) - environnement de développement android
- IDE de votre choix (ex. [Visual Studio Code](https://code.visualstudio.com/))

Bonus:
- [Genymotion](https://www.genymotion.com/download/) - simulateur android tierce-partie
- [fastlane](https://fastlane.tools/) - automatisation de build et release

#### Installer les dépendances Javascript

```sh
$ yarn install
```

#### Développement sous Android

Suivre la documentation d'installation d'environnement: https://reactnative.dev/docs/environment-setup

Demander le fichier `google-services.json` à un des développeurs existant et le copier dans `./android/app/`

Ouvrir ensuite le dossier ./android du projet avec android studio

#### Développement sous iOS

TODO

#### Simulateur Android avec Genymotion (facultatif)

Une fois Genymotion installé (compte créé et identification effectuée), créer un nouveau terminal virtuel. Choisir par exemple un Samsung Galaxy S9 sous android 8.0 et laisser les paramètres par défaut.

Après installation du terminal, le démarrer. Installer ensuite les "Open GApps" (bouton en haut à droite de l'interface). Cette suite d'application nous permettra d'utiliser l'authentification Google Supercoop.

#### Périphérique Android natif

Pour pouvoir utiliser l'application en mode dev sur votre périphérique Android, vous devez le passer en mode Développeur : sur votre smartphone android, rendez-vous dans l'application Paramètres > À propos du téléphone puis tapez 10 fois sur la ligne "Numéro de build".

Dans les paramètres, aller ensuite dans la section "Options pour développeurs" et activer le "Débogage USB".

Sur votre PC, exécuter en CLI la commande `adb reverse tcp:8081 tcp8081` afin que le périphérique android puisse se connecter au serveur "Metro".

### Base de donnée

#### Générer un script de migration SQL

Une entité a évolué et donc le schéma SQL aussi ? Il faut créer un nouveau script de migration SQL. Il sera créé dans `./src/migrations`.

```sh
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:run
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:generate -n '<Nom>'
```

Ajouter la classe fraîchement créée ('`<Nom><Timestamp>`') dans Database.ts, dans la méthode `createConnexion()` de la méthode `connect()`.