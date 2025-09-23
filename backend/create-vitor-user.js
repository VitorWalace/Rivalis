const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔧 Criando seu usuário no SQLite...');
    
    const db = new sqlite3.Database('./database.sqlite');
    
    // Hash da sua senha
    bcrypt.hash('Vitorwalace123!', 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('❌ Erro ao hash senha:', hashErr);
        return;
      }
      
      // Inserir seu usuário
      const insertUser = `
        INSERT OR REPLACE INTO users (id, name, email, password, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const userId = '440e8400-e29b-41d4-a716-446655440001'; // ID único diferente
      
      db.run(insertUser, [
        userId,
        'Vitor Walace',
        'vitorwalace123@gmail.com',
        hashedPassword,
        1,
        now,
        now
      ], function(insertErr) {
        if (insertErr) {
          console.error('❌ Erro ao inserir usuário:', insertErr);
          return;
        }
        
        console.log('✅ Seu usuário criado com sucesso!');
        console.log('📧 Email: vitorwalace123@gmail.com');
        console.log('🔑 Senha: Vitorwalace123!');
        console.log('🆔 ID:', userId);
        
        db.close();
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();