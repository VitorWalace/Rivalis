const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    console.log('🔧 Criando usuário diretamente no SQLite...');
    
    const db = new sqlite3.Database('./database.sqlite');
    
    // Criar tabela users se não existir
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        isActive INTEGER DEFAULT 1,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createUserTable, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela:', err);
        return;
      }
      
      console.log('✅ Tabela users criada/verificada');
      
      // Hash da senha
      bcrypt.hash('123456', 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error('❌ Erro ao hash senha:', hashErr);
          return;
        }
        
        // Inserir usuário
        const insertUser = `
          INSERT OR REPLACE INTO users (id, name, email, password, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const now = new Date().toISOString();
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        
        db.run(insertUser, [
          userId,
          'Usuário Teste',
          'teste@teste.com',
          hashedPassword,
          1,
          now,
          now
        ], function(insertErr) {
          if (insertErr) {
            console.error('❌ Erro ao inserir usuário:', insertErr);
            return;
          }
          
          console.log('✅ Usuário criado com sucesso!');
          console.log('📧 Email: teste@teste.com');
          console.log('🔑 Senha: 123456');
          console.log('🆔 ID:', userId);
          
          db.close();
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();