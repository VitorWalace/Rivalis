# 🚀 GUIA RÁPIDO - Live Match Editor

## ⚡ ACESSO RÁPIDO

**URL da Página:**
```
http://localhost:5173/games/:gameId/live-editor
```

**Exemplo:**
```
http://localhost:5173/games/abc123def456/live-editor
```

---

## 📍 COMO ACESSAR A PARTIR DA APLICAÇÃO

### **Opção 1: Lista de Partidas do Campeonato**
1. Navegue para o campeonato
2. Vá na aba **"Partidas"**
3. Encontre a partida desejada
4. Clique no botão **"⚽ Gerenciar Ao Vivo"**

### **Opção 2: URL Direto**
1. Copie o ID da partida (gameId)
2. Cole na URL: `/games/{gameId}/live-editor`
3. Pressione Enter

---

## ⚡ FLUXO BÁSICO (30 SEGUNDOS)

### **1. INICIAR**
```
Clique: ▶️ INICIAR JOGO
```

### **2. REGISTRAR GOL**
```
Clique: ⚽ GOL
Selecione: Time
Digite: Nome do jogador (busca rápida)
Clique: ✅ CONFIRMAR
```
**Tempo: ~10 segundos**

### **3. REGISTRAR CARTÃO**
```
Clique: 🟨 AMARELO ou 🟥 VERMELHO
Selecione: Time
Digite: Jogador
Clique: ✅ CONFIRMAR
```
**Tempo: ~8 segundos**

### **4. SUBSTITUIÇÃO**
```
Clique: 🔄 SUBSTITUIÇÃO
Selecione: Time
Escolha: Jogador SAI (dropdown)
Escolha: Jogador ENTRA (dropdown)
Clique: ✅ CONFIRMAR
```
**Tempo: ~12 segundos**

### **5. FINALIZAR**
```
Clique: 🏁 FINALIZAR (canto superior direito)
```

---

## ⏱️ CONTROLES DE TEMPO

| Botão | Função | Quando Usar |
|-------|--------|-------------|
| **▶️ INICIAR JOGO** | Começa cronômetro | Início da partida |
| **⏸️ PAUSAR** | Para o tempo | Intervalo técnico, lesão |
| **▶️ RETOMAR** | Continua contagem | Após pausa |
| **⏭️ PRÓXIMO PERÍODO** | Avança fase | Fim do 1º tempo |
| **🏁 FINALIZAR** | Encerra partida | Fim do jogo |
| **+1min, +3min, +5min** | Acréscimos | Tempo adicional |

---

## 🎨 CORES E ÍCONES

### **Eventos**
- ⚽ **GOL** → Verde
- 🟨 **AMARELO** → Amarelo
- 🟥 **VERMELHO** → Vermelho
- 🔄 **SUBSTITUIÇÃO** → Azul

### **Times**
- 🏠 **CASA** → Azul
- 🚗 **VISITANTE** → Roxo

### **Status da Partida**
- 🔴 **AO VIVO** → Badge pulsando
- 🏁 **FINALIZADO** → Badge cinza
- 📅 **AGENDADO** → Badge verde

---

## 📊 ESTATÍSTICAS EM TEMPO REAL

### **Placar (Topo)**
- Mostra score atualizado automaticamente
- Destaca vencedor com 🏆 bounce
- Exibe tempo corrente MM:SS

### **Timeline (Centro-Esquerda)**
- Lista reversa (mais recente primeiro)
- Scroll vertical automático
- Editar/Excluir com hover

### **Escalações (Direita)**
- **EM CAMPO** → Verde
- **BANCO** → Cinza
- **SUBSTITUÍDO** → Âmbar
- **EXPULSO** → Vermelho

### **Estatísticas (Rodapé)**
- Barras comparativas
- Gols, Cartões, Substituições
- Porcentagens automáticas

---

## 🔥 DICAS PRO

### **Velocidade Máxima**
1. Use **Tab** para navegar entre campos
2. Digite **nome parcial** na busca de jogador
3. **Enter** para confirmar modal
4. **Esc** para cancelar

### **Correção de Erros**
- Passe mouse sobre evento na timeline
- Clique **✏️** para editar
- Clique **🗑️** para excluir (confirmação automática)
- Placar ajusta automaticamente ao remover gols

### **Tempo Adicional**
- Use botões **+1, +3, +5** em vez de editar manualmente
- Ideal para acréscimos

### **Substituições**
- Máximo 3 ou 5 (conforme regra)
- Contador aparece no modal
- Jogadores expulsos não podem entrar

---

## 🐛 PROBLEMAS COMUNS

### **Cronômetro parado**
✅ Verifique se status é **"AO VIVO"**  
✅ Clique **▶️ RETOMAR** se pausado

### **Botões desabilitados**
✅ Clique **▶️ INICIAR JOGO** primeiro

### **Jogadores não aparecem**
✅ Verifique se times têm jogadores cadastrados  
✅ Volte e adicione na página do campeonato

### **Placar errado**
✅ Exclua evento incorreto na timeline  
✅ Placar recalcula automaticamente

---

## 📱 ATALHOS DE TECLADO (FUTURO)

| Tecla | Ação |
|-------|------|
| **G** | Abrir modal de Gol |
| **Y** | Abrir modal de Amarelo |
| **R** | Abrir modal de Vermelho |
| **S** | Abrir modal de Substituição |
| **Space** | Pausar/Retomar |
| **Ctrl+Z** | Desfazer último evento |

*(Não implementado na versão atual)*

---

## 💾 SALVAMENTO

### **Automático**
- ❌ Não há autosave durante o jogo

### **Manual**
- ✅ Clique **🏁 FINALIZAR**
- ✅ Sistema salva:
  - Placar final
  - Status = 'finished'
  - Todos os eventos
  - Timestamp de finalização

### **Verificação**
- Toast verde: **"✅ Resultado salvo com sucesso!"**
- Toast vermelho: **"❌ Erro ao salvar"** → tente novamente

---

## 🎯 BOAS PRÁTICAS

### **Durante o Jogo**
1. **Não feche a aba** até finalizar
2. Mantenha atenção no minuto corrente
3. Confirme eventos imediatamente
4. Use pausar em intervalos longos

### **Registro de Eventos**
1. **Gol:** Sempre adicione assistência (se houver)
2. **Cartões:** Adicione motivo para controle
3. **Substituições:** Verifique número correto do jogador

### **Fim da Partida**
1. Revise timeline completa
2. Confirme placar correto
3. Clique **🏁 FINALIZAR**
4. Aguarde toast de confirmação
5. Volte com **← Voltar**

---

## 🚨 SITUAÇÕES ESPECIAIS

### **Prorrogação**
1. Após 2º tempo, clique **⏭️**
2. Período muda para **"PRORROGAÇÃO"**
3. Continue registrando normalmente

### **Pênaltis**
1. Registre como evento tipo **"Pênalti"**
2. Adicione no minuto 90+
3. Placar atualiza normalmente

### **Gol Contra**
1. Selecione **time adversário**
2. Escolha jogador que fez o gol contra
3. Tipo: **"Contra"**

### **Expulsão Direta**
1. Selecione **🟥 VERMELHO**
2. Jogador some da escalação
3. Não pode ser substituído

---

## ⚡ RESUMO DE 3 PASSOS

```
1. ▶️ INICIAR
2. 🎯 REGISTRAR EVENTOS (⚽🟨🟥🔄)
3. 🏁 FINALIZAR
```

**Tempo médio por partida:** 90 minutos (jogo real) + 5-10 min (registro)

---

## 📞 NEED HELP?

**Documentação Completa:**
→ `LIVE_MATCH_EDITOR_README.md` (2000+ linhas)

**Código Fonte:**
→ `frontend/src/pages/LiveMatchEditorPage.tsx`
→ `frontend/src/components/` (7 componentes)

**Rota:**
→ `App.tsx` linha ~120: `/games/:gameId/live-editor`

---

**✅ Pronto para usar! Boa sorte com suas partidas! ⚽🏆**
