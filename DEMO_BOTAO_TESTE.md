## 🎬 Demonstração Visual do Botão de Teste

```
╔════════════════════════════════════════════════════════════════════╗
║                    🏆 Campeonato Brasileiro 2025                   ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  🏆  Campeonato Brasileiro 2025                                   ║
║  ⚽ Futebol  |  🏆 Pontos Corridos  |  🌐 Público  |  ⚡ Em And... ║
║                                                                    ║
║  📍 São Paulo, SP  |  📅 16/10/2025 - 20/12/2025  |  👥 Máx. 20  ║
║                                                                    ║
║                                        ┌──────────────────────┐   ║
║                                        │ ⚡ Gerar Dados Teste │ ◄─ NOVO!
║                                        └──────────────────────┘   ║
║                                        ┌──────────────────────┐   ║
║                                        │ ✏️  Editar           │   ║
║                                        └──────────────────────┘   ║
║                                        ┌──────────────────────┐   ║
║                                        │ 🗑️  Excluir          │   ║
║                                        └──────────────────────┘   ║
╚════════════════════════════════════════════════════════════════════╝
```

### Após clicar no botão:

```
╔════════════════════════════════════════════════════════════════════╗
║                          🎉 Sucesso!                               ║
║   10 times com 10 jogadores cada foram gerados!                   ║
╚════════════════════════════════════════════════════════════════════╝
```

### Na aba "Times", você verá:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏆 Times Cadastrados (10)                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ 🦅 Águias FC    │  │ 🦁 Leões United │  │ 🐯 Tigres SC    │ │
│  │ ÁGU             │  │ LEÕ             │  │ TIG             │ │
│  │                 │  │                 │  │                 │ │
│  │ 👥 10 jogadores │  │ 👥 10 jogadores │  │ 👥 10 jogadores │ │
│  │ 📊 0V 0E 0D     │  │ 📊 0V 0E 0D     │  │ 📊 0V 0E 0D     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ 🦅 Falcões EC   │  │ 🐆 Panteras FC  │  │ 🐺 Lobos AC     │ │
│  │ FAL             │  │ PAN             │  │ LOB             │ │
│  │                 │  │                 │  │                 │ │
│  │ 👥 10 jogadores │  │ 👥 10 jogadores │  │ 👥 10 jogadores │ │
│  │ 📊 0V 0E 0D     │  │ 📊 0V 0E 0D     │  │ 📊 0V 0E 0D     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ... e mais 4 times!                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Expandindo um time, você vê os jogadores:

```
┌──────────────────────────────────────────────────────────────────┐
│ 🦅 Águias FC                                                      │
├──────────────────────────────────────────────────────────────────┤
│ 👥 Elenco (10 jogadores)                                         │
│                                                                   │
│  #1  João Silva           🥅 Goleiro         📊 0G 0A            │
│  #2  Pedro Santos         🛡️  Defensor       📊 0G 0A            │
│  #3  Lucas Oliveira       🛡️  Defensor       📊 0G 0A            │
│  #4  Matheus Souza        🛡️  Defensor       📊 0G 0A            │
│  #5  Gabriel Lima         🛡️  Defensor       📊 0G 0A            │
│  #6  Rafael Costa         ⚙️  Meio-campo     📊 0G 0A            │
│  #7  Bruno Pereira        ⚙️  Meio-campo     📊 0G 0A            │
│  #8  Diego Rodrigues      ⚙️  Meio-campo     📊 0G 0A            │
│  #9  Carlos Almeida       ⚽ Atacante        📊 0G 0A            │
│  #10 André Nascimento     ⚽ Atacante        📊 0G 0A            │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxo de Uso:

```
Usuário                    Sistema                    Resultado
   │                          │                           │
   ├─ Clica "Gerar Dados" ───>│                           │
   │                          │                           │
   │                          ├─ Gera 10 nomes de times  │
   │                          ├─ Para cada time:         │
   │                          │  ├─ Gera 10 jogadores    │
   │                          │  ├─ Define posições      │
   │                          │  ├─ Atribui números      │
   │                          │  └─ Zera estatísticas    │
   │                          │                           │
   │                          ├─ Salva no localStorage   │
   │                          ├─ Atualiza state          │
   │                          │                           │
   │<─── Toast de Sucesso ────┤                           │
   │                          │                           │
   ├─ Acessa aba "Times" ─────────────────────────────────>│
   │                          │                           │
   │<──────────────────────────────── 10 times exibidos ──┤
```

### 🎨 Estilo do Botão:

```css
Cor Base:      Gradiente roxo-rosa (purple-600 → pink-600)
Hover:         Gradiente escuro (purple-700 → pink-700)
Sombra:        Média (shadow-md) → Grande (shadow-lg) no hover
Transição:     Suave (transition-all)
Ícone:         ⚡ Raio (simboliza velocidade/geração automática)
Posição:       Canto superior direito, antes dos botões Editar/Excluir
Tooltip:       "Gera 10 times com 10 jogadores cada para testes"
```

---

**Agora você pode testar o sistema com dados realistas em segundos! 🚀**
