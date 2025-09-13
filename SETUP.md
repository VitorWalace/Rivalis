# 🚀 Como Executar o Rivalis Completo

## 📋 Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **PostgreSQL** (versão 12 ou superior)
3. **Git** (opcional, para clonar o repositório)

## 🔧 Setup Inicial

### 1. Configurar PostgreSQL

1. Instale o PostgreSQL em seu sistema
2. Abra o pgAdmin ou terminal PostgreSQL
3. Execute os comandos SQL:

```sql
CREATE DATABASE rivalis_db;
CREATE USER usuario WITH PASSWORD 'senha';
GRANT ALL PRIVILEGES ON DATABASE rivalis_db TO usuario;
```

### 2. Configurar Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Edite o arquivo `.env` com suas configurações do banco

4. Inicialize o banco de dados:
```bash
npm run init-db
```

### 3. Configurar Frontend

1. Navegue até a pasta raiz do projeto:
```bash
cd ..
```

2. As dependências do frontend já devem estar instaladas
3. Se necessário, instale novamente:
```bash
npm install
```

## ▶️ Executando o Sistema

### 1. Iniciar o Backend (Terminal 1)

```bash
cd backend
npm run dev
```

O servidor backend estará rodando em: `http://localhost:5000`

### 2. Iniciar o Frontend (Terminal 2)

```bash
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

## 🧪 Testando o Sistema

### 1. Acessar a Aplicação
- Abra o navegador em `http://localhost:5173`
- Você será redirecionado para a página de login

### 2. Criar Nova Conta
1. Clique em "Cadastre-se"
2. Preencha os dados:
   - **Nome:** Seu nome completo
   - **Email:** Um email válido
   - **Senha:** Mínimo 6 caracteres (maiúscula, minúscula, número)
   - **Confirmar Senha:** Repita a senha
3. Clique em "Criar conta"

### 3. Fazer Login
1. Na página de login, insira:
   - **Email:** O email cadastrado
   - **Senha:** A senha cadastrada
2. Clique em "Entrar"

### 4. Usar o Sistema
- Após o login, você será redirecionado para o dashboard
- Agora você pode criar campeonatos, adicionar times e jogadores
- Todas as funcionalidades do sistema estarão disponíveis

## 🔍 Verificando se Está Funcionando

### Backend
- Acesse `http://localhost:5000/health` no navegador
- Deve retornar: `{"success": true, "message": "Rivalis API está funcionando!"}`

### Frontend
- A página de login deve carregar sem erros
- Os formulários devem validar os dados corretamente
- Mensagens de erro/sucesso devem aparecer via toast

### Banco de Dados
- No pgAdmin, verifique se a tabela `users` foi criada
- Após criar uma conta, deve aparecer um registro na tabela

## 🐛 Solucionando Problemas

### "Erro de conexão com o banco"
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `backend/.env`
3. Teste a conexão manualmente

### "CORS Error"
1. Certifique-se de que o backend está rodando na porta 5000
2. Verifique se `FRONTEND_URL=http://localhost:5173` está no `.env`

### "Token inválido"
1. Verifique se `JWT_SECRET` está definido no `.env`
2. Tente fazer logout e login novamente

### "Módulo não encontrado"
1. Execute `npm install` tanto na raiz quanto na pasta backend
2. Verifique se todas as dependências foram instaladas

## 📱 Funcionalidades Disponíveis

Com o sistema rodando, você terá acesso a:

✅ **Sistema de Autenticação Completo**
- Registro com validações robustas
- Login com JWT
- Proteção de rotas
- Logout seguro

✅ **Gestão de Campeonatos**
- Criar campeonatos (wizard 4 etapas)
- Adicionar times e jogadores
- Gerar jogos automaticamente
- Visualizar classificação

✅ **Sistema Gamificado**
- Pontos de XP por ações
- Sistema de conquistas/badges
- Rankings individuais
- Perfis de jogadores

✅ **Interface Moderna**
- Design responsivo
- Animações suaves
- Notificações toast
- Componentes acessíveis

## 📚 Próximos Passos

1. **Explorar o Sistema:** Navegue pelas funcionalidades
2. **Criar Campeonatos:** Teste o wizard completo
3. **Lançar Resultados:** Use o modal de resultados
4. **Ver Estatísticas:** Analise os perfis de jogadores

---

**🎉 Parabéns! O Rivalis está rodando com sucesso!** 

O sistema agora usa um banco de dados real e está pronto para ser expandido com novas funcionalidades.