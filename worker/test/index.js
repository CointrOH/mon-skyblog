// Point d'entrée pour `node --test worker/test`.
//
// Depuis Node.js 24, le runner de tests ne développe plus un argument
// répertoire : il le résout comme un module. Ce fichier permet donc à la
// commande demandée `node --test worker/test` de charger les tests du dossier.
// Ajouter ici tout nouveau module `*.test.mjs` du dossier.
import './validate.test.mjs';
