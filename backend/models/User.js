const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeValidate: async (user) => {
      if (user.email) {
        user.email = String(user.email).trim().toLowerCase();
      }
    },
    beforeCreate: async (user) => {
      if (user.password) {
        console.log('🔒 Criptografando senha no registro...');
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('✅ Senha criptografada com sucesso');
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        console.log('🔒 Criptografando senha na atualização...');
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('✅ Senha criptografada com sucesso');
      }
    },
  },
});

// Método para verificar senha
User.prototype.validatePassword = async function(password) {
  console.log('🔍 Comparando senhas...');
  console.log('  - Senha fornecida:', password ? '***' : 'vazio');
  console.log('  - Hash armazenado:', this.password ? this.password.substring(0, 20) + '...' : 'vazio');
  const isValid = await bcrypt.compare(password, this.password);
  console.log('  - Resultado:', isValid ? '✅ Válida' : '❌ Inválida');
  return isValid;
};

// Método para remover campos sensíveis
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Definir associações
User.associate = (models) => {
  // Um usuário pode criar muitos campeonatos
  User.hasMany(models.Championship, {
    foreignKey: 'createdBy',
    as: 'championships',
  });
};

module.exports = User;