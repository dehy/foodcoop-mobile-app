# README

## Développement

L'application Supercoop est développé en React Native. Le projet utilise les langages Typescript (TSX), CSS, Objective-C (projet iOS), et Java (projet Android).

### Pré-requis

- Yarn
- Xcode
- Android Studio

### Installer les dépendances Javascript

```sh
$ yarn install
```

### Générer un script de migration SQL

Une entité a évolué et donc le schéma SQL aussi ? Il faut créer un nouveau script de migration SQL. Il sera créé dans `./src/migrations`.

```sh
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:run
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:generate -n '<Nom>'
```

Ajouter la classe fraîchement créée ('`<Nom><Timestamp>`') dans Database.ts, dans la méthode `createConnexion()` de la méthode `connect()`.