const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  avatar: {
    type: Sequelize.STRING,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: Sequelize.DATE,
  },
});

async function createUser() {
  try {
    await sequelize.sync();
    
    const email = 'vitorwalace123@gmail.com';
    const password = 'sua-senha'; // MUDE AQUI PARA SUA SENHA
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      console.log('✅ Usuário já existe!');
      console.log('Email:', email);
      return;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = await User.create({
      name: 'Vitor Walace',
      email: email,
      password: hashedPassword,
      isActive: true,
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('ID:', user.id);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

createUser();
