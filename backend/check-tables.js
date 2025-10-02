const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('Tabelas encontradas:', rows);
  }
  db.close();
});