var elasticsearch = require('elasticsearch');
var csv = require('csv-parser');
var fs = require('fs');

var esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

// Création de l'indice
esClient.indices.create({ 
  index: '911' ,
  body : {
    "mappings" : {
      "call" : {
        "properties" : {
          coordonnees : { type: 'geo_point'},
          dateheure : { type : 'date', format : "yyyy-MM-dd HH:mm:ss"}
        }
      }
    }
  }
}, (err, resp) => {
  if (err) console.trace(err.message);
});

let calls = [];

fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      // Extract one line from CSV
      calls.push({
        coordonnees: {lon :parseFloat(data.lng), lat:parseFloat(data.lat)},
        description: data.desc,
        codepostal: data.zip,
        titre: data.title,
        dateheure: data.timeStamp,
        quartier: data.twp,
        adresse: data.addr,
		categorie: data.title.split(":")[0]
      })
    })
    .on('end', () => {
      // Insert data to ES
      esClient.bulk(createBulkInsertQuery(calls), (err, resp) => {
        if (err) console.trace(err.message);
        else console.log(`Inserted ${resp.items.length} calls`);
        esClient.close();
      });
    });

 // Fonction utilitaire permettant de formatter les données pour l'insertion "bulk" dans elastic
function createBulkInsertQuery(calls) {
  const body = calls.reduce((acc, call) => {
    acc.push({ index: { _index: '911', _type: 'call' } })
    acc.push(call)
    return acc
  }, []);

  return { body };
}   
