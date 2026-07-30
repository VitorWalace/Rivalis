const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Garante que a tabela de jogos possua colunas necessárias adicionadas recentemente.
 */
async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName;
    return name === tableName;
  });
}

async function ensureGameSchema() {
  const queryInterface = sequelize.getQueryInterface();

  // Banco novo: o sync() cria as tabelas já no formato atual, nada a migrar.
  if (!(await tableExists(queryInterface, 'games'))) {
    console.log('ℹ️ Tabela "games" ainda não existe, pulando migração de esquema.');
    return;
  }

  try {
    const gameTable = await queryInterface.describeTable('games');

    if (!gameTable.stage) {
      await queryInterface.addColumn('games', 'stage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log('🛠️ Coluna "stage" adicionada na tabela games.');
    }
  } catch (error) {
    console.error('❌ Falha ao garantir estrutura da tabela games:', error.message);
    throw error;
  }

  if (!(await tableExists(queryInterface, 'players'))) {
    return;
  }

  try {
    const playerTable = await queryInterface.describeTable('players');
    const positionColumn = playerTable.position;

    if (positionColumn && typeof positionColumn.type === 'string' && positionColumn.type.toLowerCase().startsWith('enum')) {
      await queryInterface.changeColumn('players', 'position', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
      console.log('🛠️ Coluna "position" da tabela players atualizada para STRING(100).');
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível ajustar a coluna "position" da tabela players:', error.message);
  }
}

module.exports = {
  ensureGameSchema,
};
