# Rivalis ⚽

## 🎯 Sobre o Projeto

**Rivalis** é um aplicativo web completo para gerenciamento de campeonatos amadores com foco na jornada e progressão individual de cada jogador. O sistema funciona como um videogame, onde os jogadores ganham pontos de experiência (XP), medalhas por feitos notáveis (badges/conquistas) e competem em rankings individuais.

### 🌟 Diferencial Principal

O foco do aplicativo **não é apenas gerenciar times**, mas sim a **jornada e a progressão individual de cada jogador**. O objetivo é aumentar o engajamento e a motivação de todos os participantes, mesmo que seu time não esteja bem no campeonato.

## � Equipe
- Vitor Walace
- Isabella Correia

## 🌐 Deploy
- Frontend (Vercel): [https://rivalis.vercel.app](https://rivalis.vercel.app)
- Backend (Railway): MySQL gerenciado. A URL de conexão é secreta — configure-a em `MYSQL_URL` (veja `backend/.env.example`), nunca neste arquivo.

## �🚀 Tecnologias Utilizadas

### Frontend
- **React 18.2.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.2.2** - Linguagem tipada baseada em JavaScript  
- **Vite 5.0.0** - Build tool e bundler moderno
- **Tailwind CSS 3.3.6** - Framework CSS utilitário
- **React Router DOM 6.20.1** - Roteamento para SPAs
- **Zustand 4.4.7** - Gerenciamento de estado global
- **React Hook Form 7.48.2** - Gerenciamento de formulários
- **Zod 3.22.4** - Validação de schemas
- **@headlessui/react** - Componentes acessíveis não estilizados
- **@heroicons/react** - Biblioteca de ícones
- **Framer Motion** - Animações e transições
- **React Hot Toast** - Notificações elegantes

### Desenvolvimento
- **PostCSS 8.4.32** - Processador de CSS
- **Autoprefixer 10.4.16** - Plugin para compatibilidade de browsers
- **ESLint** - Linting de código

## 📱 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- [x] Página de Login com validação
- [x] Página de Cadastro
- [x] Proteção de rotas
- [x] Gerenciamento de estado de usuário

### ✅ Dashboard de Campeonatos
- [x] Lista de campeonatos do usuário
- [x] Criação de novos campeonatos
- [x] Visualização do papel (Admin/Participante)

### ✅ Wizard de Criação de Campeonatos
- [x] **Passo 1:** Detalhes básicos (nome, esporte)
- [x] **Passo 2:** Adicionar times
- [x] **Passo 3:** Cadastrar jogadores por time
- [x] **Passo 4:** Geração automática de jogos (Mata-mata & Fase de grupos + mata-mata)

### ✅ Página Principal do Campeonato
- [x] **Aba Destaques:** Rankings de artilheiros, assistências e MVP (XP)
- [x] **Aba Jogos:** Lista de jogos por rodada com status
- [x] **Aba Classificação:** Tabela tradicional de pontos
- [x] **Aba Jogadores:** Lista completa com estatísticas

### ✅ Sistema de Progressão Gamificado
- [x] **Pontos de XP:** Jogar (+10), Vencer (+25), Gol (+20), Assistência (+15)
- [x] **Sistema de Conquistas:** 8 badges implementadas
- [x] **Rankings individuais** por XP, gols e assistências

### ✅ Perfil Individual do Jogador
- [x] Estatísticas detalhadas (jogos, gols, assistências, vitórias)
- [x] Galeria visual de conquistas/badges
- [x] Histórico de performance
- [x] Cálculo de médias por jogo

### ✅ Lançamento de Resultados
- [x] Modal intuitivo para inserir placares
- [x] Seleção dinâmica de marcadores e assistentes
- [x] Atualização automática de estatísticas
- [x] Verificação automática de conquistas
- [x] Cálculo automático de XP

## 🏆 Sistema de Conquistas

| Conquista | Descrição | Condição | XP |
|-----------|-----------|----------|-----|
| ⚽ Artilheiro Nato | Marque 5 gols no campeonato | ≥ 5 gols | +50 |
| 🎩 Hat-Trick | Marque 3 gols no mesmo jogo | 3 gols em 1 jogo | +100 |
| 🍽️ Garçom | Alcance 5 assistências | ≥ 5 assistências | +40 |
| 🏆 Decisivo | Marque o gol da vitória | Gol da vitória | +30 |
| 🌟 Estreante | Jogue sua primeira partida | 1º jogo | +10 |
| 👴 Veterano | Jogue 10 partidas | ≥ 10 jogos | +75 |
| ⭐ Craque | Alcance 1000 pontos de XP | ≥ 1000 XP | +100 |
| 🥇 Artilheiro da Rodada | Maior pontuador da rodada | MVP rodada | +25 |

## 🎮 Sistema de XP

| Ação | XP Ganho |
|------|----------|
| Jogar uma partida | +10 XP |
| Vencer a partida | +25 XP |
| Marcar um gol | +20 XP |
| Dar uma assistência | +15 XP |

## 🛠️ Como Executar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd rivalis
```

2. Gere os arquivos `.env` de exemplo:
```bash
pwsh scripts/bootstrap-env.ps1
```

Se quiser sobrescrever arquivos já existentes, use `-Force`.

3. Instale as dependências do **frontend**:
```bash
cd frontend
npm install
```

4. Execute o projeto (frontend):
```bash
npm run dev
```

> 💡 O backend fica na pasta `backend/`. Para executá-lo localmente:
> ```bash
> cd backend
> npm install
> npm run init-db   # opcional: sincronizar tabelas
> npm start
> ```

### Backend - Setup rápido no Windows

1) Gerar `.env` a partir do exemplo:

```bat
cd backend
copy .env.example .env
```

2) Abra `backend/.env` e cole a URL do MySQL do Railway em `MYSQL_URL` (ou `DATABASE_URL`).

Opcional: para não precisar editar `.env` em cada máquina, defina a variável de ambiente de usuário uma vez (reabra o terminal depois):

```cmd
setx MYSQL_URL "mysql://usuario:senha@host:porta/railway"
```

Mais detalhes e alternativas estão em `backend/README.md`.

5. Acesse no navegador:
```
http://localhost:5173
```

## 📦 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera o build para produção
npm run preview      # Visualiza o build de produção
npm run lint         # Executa o linting do código
```

## 🗂️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── GameResultModal.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Páginas da aplicação
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── CreateChampionshipPage.tsx
│   ├── ChampionshipPage.tsx
│   └── PlayerProfilePage.tsx
├── store/              # Gerenciamento de estado (Zustand)
│   ├── authStore.ts
│   └── championshipStore.ts
├── types/              # Definições de tipos TypeScript
│   └── index.ts
├── utils/              # Utilitários e helpers
│   ├── index.ts
│   └── achievements.ts
└── hooks/              # Hooks customizados
```

## 🎨 Design System

### Cores Principais
- **Primary:** Azul (#3b82f6)
- **Secondary:** Azul claro (#0ea5e9)
- **Success:** Verde (#10b981)
- **Error:** Vermelho (#ef4444)

### Componentes CSS Customizados
- `.btn-primary` - Botão principal
- `.btn-secondary` - Botão secundário  
- `.card` - Container padrão
- `.input-field` - Campo de entrada

## 🔮 Próximas Funcionalidades

### Backend (Node.js + Express + MySQL)
- [ ] API REST completa
- [ ] Sistema de autenticação JWT
- [ ] Banco de dados MySQL
- [ ] Upload de imagens (Cloudinary)
- [ ] WebSockets para tempo real

### Novas Features
- [ ] Chat em tempo real
- [ ] Notificações push
- [ ] Comparação entre jogadores
- [ ] Estatísticas avançadas
- [ ] Exportação de relatórios
- [ ] Modo escuro
- [ ] Responsividade mobile

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📑 Documentação Complementar
- [STATUS_ATUAL.md](STATUS_ATUAL.md)
- [STATUS_FINAL.md](STATUS_FINAL.md)
- [RELATORIO_FINAL.md](RELATORIO_FINAL.md)

## 🙏 Agradecimentos

- Design inspirado em aplicativos de gaming
- Ícones da Heroicons
- Componentes da Headless UI
- Animações do Framer Motion

---

**Rivalis** - Transformando campeonatos amadores em experiências gamificadas! 🏆⚽
