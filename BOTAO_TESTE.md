# 🧪 Botão de Geração de Dados de Teste

## 📋 Descrição

Foi adicionado um botão **"Gerar Dados de Teste"** na página de detalhes de cada campeonato para facilitar testes da aplicação.

## 🎯 Localização

O botão está localizado no **header do campeonato**, ao lado dos botões "Editar" e "Excluir":

```
[⚡ Gerar Dados de Teste] [✏️ Editar] [🗑️ Excluir]
```

## ✨ Funcionalidade

Ao clicar no botão, o sistema **gera automaticamente**:

### 📊 10 Times
- **Águias FC**
- **Leões United**
- **Tigres SC**
- **Falcões EC**
- **Panteras FC**
- **Lobos AC**
- **Dragões FC**
- **Tubarões SC**
- **Cobras EC**
- **Gladiadores FC**

### 👥 10 Jogadores por Time (100 jogadores no total)
Cada jogador possui:
- **Nome completo** (combinação aleatória de primeiros e últimos nomes brasileiros)
- **Número da camisa** (1 a 10)
- **Posição**:
  - Jogador 1: Goleiro
  - Jogadores 2-5: Defensores
  - Jogadores 6-8: Meio-campo
  - Jogadores 9-10: Atacantes
- **Estatísticas zeradas** (games, goals, assists, wins, losses, draws)
- **XP inicial**: 0
- **Nível inicial**: 1
- **Lista de conquistas vazia**

### 📈 Estatísticas dos Times
Cada time é criado com:
- **Estatísticas zeradas**: 0 jogos, 0 vitórias, 0 empates, 0 derrotas
- **Gols**: 0 a favor, 0 contra
- **Pontos**: 0
- **Posição**: 0

## 🎨 Design

O botão possui:
- **Gradiente roxo para rosa** (`from-purple-600 to-pink-600`)
- **Ícone de raio** ⚡ (simbolizando geração rápida)
- **Efeito hover** com sombra aumentada
- **Tooltip** explicativo ao passar o mouse

## 💡 Casos de Uso

Ideal para:
1. **Testar funcionalidades** de gerenciamento de times
2. **Testar geração automática** de partidas
3. **Visualizar a interface** com dados populados
4. **Desenvolvimento e demonstrações** sem precisar cadastrar manualmente
5. **Testar escalabilidade** da UI com múltiplos times e jogadores

## 🔄 Como Usar

1. Acesse qualquer campeonato
2. Clique no botão **"Gerar Dados de Teste"** no header
3. Aguarde a confirmação (toast verde com mensagem de sucesso)
4. Os 10 times com 100 jogadores estarão disponíveis na aba "Times"

## ⚠️ Observações

- Os dados gerados **não sobrescrevem** times existentes, apenas adiciona novos
- Cada time terá um ID único baseado em timestamp
- Os nomes dos jogadores são gerados aleatoriamente para simular um elenco realista
- Todos os dados são salvos no localStorage automaticamente

## 🚀 Benefícios

✅ **Economia de tempo** - Não precisa cadastrar 100 jogadores manualmente  
✅ **Dados realistas** - Nomes brasileiros e estrutura de time completa  
✅ **Testes rápidos** - Pronto para testar partidas e tabelas  
✅ **Demonstrações** - Ideal para apresentar o sistema funcionando  
✅ **Desenvolvimento ágil** - Facilita testar novas funcionalidades

---

**Desenvolvido para facilitar testes e demonstrações do sistema Rivalis** 🏆
