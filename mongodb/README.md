# 911 Calls avec MongoDB

## Import du jeu de données

Pour importer le jeu de données, complétez le script `import.js` (cherchez le `TODO` dans le code :wink:).

Exécutez-le ensuite :

```bash
npm install
node import.js
```

Vérifiez que les données ont été importées correctement grâce au shell (le nombre total de documents doit être `153194`) :

```
use 911-calls
db.calls.count()
```

## Index géographique et index textuel

Afin de répondre aux différents problèmes, vous allez avoir besoin de créer deux index particuliers sur la collection des appels :

* Un index géographique de type `2dsphere` pour les coordonnées GPS des appels.
  * https://docs.mongodb.com/manual/core/2dsphere/#create-a-2dsphere-index
* Un index textuel sur le titre des appels pour pouvoir faire des recherches full-text sur ce champ (recherche des overdoses par exemple)
  * https://docs.mongodb.com/manual/core/index-text/#create-text-index

## Requêtes

### Création des index ###

```
db.calls.createIndex( {loc: "2dsphere"} )
db.calls.createIndex( {title: "text"} )
```

### Compter le nombre d'appels autour de Lansdale dans un rayon de 500 mètres

#### Requête ####

```
db.calls.find(
    {loc:
        {$near:
            {$geometry:
                {type: "Point",
                 coordinates: [-75.283783,40.241493]
                },
                $maxDistance: 500
            }
        }
    } ).count()
```

#### Réponse ####

```
717
```

### Compter le nombre d'appels par catégorie

#### Requête ####

```
db.calls.aggregate( [
    {$group: {_id: "$category", count: {$sum: 1}}}
] )
```

#### Réponse ####

```
{ "_id" : "Fire", "count" : 23056 }
{ "_id" : "Traffic", "count" : 54549 }
{ "_id" : "EMS", "count" : 75589 }
```

### Trouver les 3 mois ayant comptabilisés le plus d'appels

#### Requête ####

```
db.calls.aggregate( [
    {$group: {_id: {month: {$month: "$timeStamp"}, year: {$year: "$timeStamp"}}, count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: 3}
] )
```

#### Réponse ####

```
{ "_id" : { "month" : 1, "year" : 2016 }, "count" : 13084 }
{ "_id" : { "month" : 10, "year" : 2016 }, "count" : 12502 }
{ "_id" : { "month" : 12, "year" : 2016 }, "count" : 12162 }
```

### Trouver le top 3 des villes avec le plus d'appels pour overdose

#### Requête ####

```
db.calls.aggregate( [
    {$match: {$text: {$search: "overdose"}}},
    {$group: {_id: {town: "$twp"}, count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: 3}
] )
```

#### Réponse ####

```
{ "_id" : { "town" : "POTTSTOWN" }, "count" : 203 }
{ "_id" : { "town" : "NORRISTOWN" }, "count" : 180 }
{ "_id" : { "town" : "UPPER MORELAND" }, "count" : 110 }
```