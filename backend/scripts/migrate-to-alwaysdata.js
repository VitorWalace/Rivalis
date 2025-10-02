const { Sequelize, DataTypes } = require('sequelize');
const sqlite3 = require('sqlite3');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do SQLite (origem)
const sqliteDb = new sqlite3.Database('./database.sqlite');

// Configuração do MySQL AlwaysData (destino)
const mysqlConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function migrateData() {
  console.log('🔄 Iniciando migração do SQLite para AlwaysData MySQL...');
  
  try {
    // Conectar ao MySQL
    const mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Conectado ao MySQL AlwaysData');

    // Criar as tabelas no MySQL
    await createMySQLTables(mysqlConnection);
    
    // Migrar dados
    await migrateUsers(mysqlConnection);
    await migrateChampionships(mysqlConnection);
    await migrateTeams(mysqlConnection);
    await migratePlayers(mysqlConnection);
    await migrateGames(mysqlConnection);
    await migrateGoals(mysqlConnection);
    
    await mysqlConnection.end();
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

async function createMySQLTables(connection) {
  console.log('📊 Criando tabelas no MySQL...');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS championships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      startDate DATE,
      endDate DATE,
      format ENUM('league', 'knockout', 'group_knockout') DEFAULT 'league',
      status ENUM('planned', 'ongoing', 'finished') DEFAULT 'planned',
      userId INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo VARCHAR(500),
      championshipId INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (championshipId) REFERENCES championships(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS players (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(100),
      number INT,
      teamId INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      homeTeamId INT NOT NULL,
      awayTeamId INT NOT NULL,
      homeScore INT DEFAULT 0,
      awayScore INT DEFAULT 0,
      gameDate DATETIME,
      status ENUM('scheduled', 'ongoing', 'finished') DEFAULT 'scheduled',
      championshipId INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (homeTeamId) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (awayTeamId) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (championshipId) REFERENCES championships(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      playerId INT NOT NULL,
      gameId INT NOT NULL,
      minute INT,
      type ENUM('goal', 'own_goal', 'penalty') DEFAULT 'goal',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
    )`
  ];
  
  for (const table of tables) {
    await connection.execute(table);
  }
  
  console.log('✅ Tabelas criadas no MySQL');
}

function getSQLiteData(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrateUsers(connection) {
  console.log('👥 Migrando usuários...');
  try {
    const users = await getSQLiteData('users');
    
    for (const user of users) {
      await connection.execute(
        'INSERT INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [user.id, user.name, user.email, user.password, user.createdAt, user.updatedAt]
      );
    }
    
    console.log(`✅ ${users.length} usuários migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela users não encontrada ou vazia no SQLite');
  }
}

async function migrateChampionships(connection) {
  console.log('🏆 Migrando campeonatos...');
  try {
    const championships = await getSQLiteData('championships');
    
    for (const championship of championships) {
      await connection.execute(
        'INSERT INTO championships (id, name, description, startDate, endDate, format, status, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [championship.id, championship.name, championship.description, championship.startDate, championship.endDate, championship.format, championship.status, championship.userId, championship.createdAt, championship.updatedAt]
      );
    }
    
    console.log(`✅ ${championships.length} campeonatos migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela championships não encontrada ou vazia no SQLite');
  }
}

async function migrateTeams(connection) {
  console.log('⚽ Migrando times...');
  try {
    const teams = await getSQLiteData('teams');
    
    for (const team of teams) {
      await connection.execute(
        'INSERT INTO teams (id, name, logo, championshipId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [team.id, team.name, team.logo, team.championshipId, team.createdAt, team.updatedAt]
      );
    }
    
    console.log(`✅ ${teams.length} times migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela teams não encontrada ou vazia no SQLite');
  }
}

async function migratePlayers(connection) {
  console.log('👤 Migrando jogadores...');
  try {
    const players = await getSQLiteData('players');
    
    for (const player of players) {
      await connection.execute(
        'INSERT INTO players (id, name, position, number, teamId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [player.id, player.name, player.position, player.number, player.teamId, player.createdAt, player.updatedAt]
      );
    }
    
    console.log(`✅ ${players.length} jogadores migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela players não encontrada ou vazia no SQLite');
  }
}

async function migrateGames(connection) {
  console.log('🎯 Migrando jogos...');
  try {
    const games = await getSQLiteData('games');
    
    for (const game of games) {
      await connection.execute(
        'INSERT INTO games (id, homeTeamId, awayTeamId, homeScore, awayScore, gameDate, status, championshipId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE homeScore=VALUES(homeScore)',
        [game.id, game.homeTeamId, game.awayTeamId, game.homeScore, game.awayScore, game.gameDate, game.status, game.championshipId, game.createdAt, game.updatedAt]
      );
    }
    
    console.log(`✅ ${games.length} jogos migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela games não encontrada ou vazia no SQLite');
  }
}

async function migrateGoals(connection) {
  console.log('⚽ Migrando gols...');
  try {
    const goals = await getSQLiteData('goals');
    
    for (const goal of goals) {
      await connection.execute(
        'INSERT INTO goals (id, playerId, gameId, minute, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE minute=VALUES(minute)',
        [goal.id, goal.playerId, goal.gameId, goal.minute, goal.type, goal.createdAt, goal.updatedAt]
      );
    }
    
    console.log(`✅ ${goals.length} gols migrados`);
  } catch (error) {
    console.log('ℹ️ Tabela goals não encontrada ou vazia no SQLite');
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };