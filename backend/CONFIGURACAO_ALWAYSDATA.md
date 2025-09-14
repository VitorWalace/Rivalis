# Configuração do AlwaysData para Rivalis

## 📋 Passo a passo para configurar o banco de dados

### 1. Obter credenciais do AlwaysData

No painel do AlwaysData, vá para a seção de banco de dados e anote:
- **Host**: Geralmente no formato `mysql-seuprojeteo.alwaysdata.net`
- **Porta**: Normalmente `3306` para MySQL
- **Nome do banco**: Nome do seu projeto ou personalizado
- **Usuário**: Seu usuário do AlwaysData
- **Senha**: Senha do banco de dados

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` no diretório backend e substitua os valores de exemplo pelas suas credenciais reais:

```env
# Configurações do Banco de Dados - AlwaysData
DB_HOST=mysql-seuprojeto.alwaysdata.net
DB_PORT=3306
DB_NAME=seuprojeto_bd
DB_USER=seuprojeto
DB_PASSWORD=suasenha
DB_DIALECT=mysql
```

### 3. Testar conexão

Execute o script de teste:
```bash
cd backend
node scripts/test-alwaysdata-connection.js
```

### 4. Migrar dados (opcional)

Se você tem dados no SQLite local que quer migrar:
```bash
node scripts/migrate-to-alwaysdata.js
```

### 5. Inicializar banco

Para criar as tabelas no AlwaysData:
```bash
npm run init-db
```

### 6. Iniciar servidor

```bash
node server.js
```

## 🔧 Comandos úteis

### Testar apenas a conexão:
```bash
node scripts/test-alwaysdata-connection.js
```

### Migrar dados do SQLite:
```bash
node scripts/migrate-to-alwaysdata.js
```

### Verificar tabelas no banco:
```bash
mysql -h mysql-seuprojeto.alwaysdata.net -u seuprojeto -p seuprojeto_bd -e "SHOW TABLES;"
```

## 🚨 Possíveis problemas e soluções

### Erro de conexão:
- Verifique se as credenciais estão corretas
- Confirme se o IP do seu local está liberado no AlwaysData
- Teste a conexão diretamente via MySQL client

### Erro de SSL:
Se houver problemas de SSL, adicione ao `.env`:
```env
DB_SSL=false
```

### Timeout de conexão:
Aumente os timeouts no arquivo de configuração do banco.

## 📊 Estrutura das tabelas

O sistema criará automaticamente as seguintes tabelas:
- `users` - Usuários do sistema
- `championships` - Campeonatos
- `teams` - Times
- `players` - Jogadores
- `games` - Jogos/Partidas
- `goals` - Gols marcados

## 🔄 Alternando entre SQLite e MySQL

Para voltar ao SQLite local, comente as linhas do MySQL no `.env`:
```env
# DB_HOST=mysql-seuprojeto.alwaysdata.net
# DB_PORT=3306
# DB_NAME=seuprojeto_bd
# DB_USER=seuprojeto
# DB_PASSWORD=suasenha
# DB_DIALECT=mysql
```