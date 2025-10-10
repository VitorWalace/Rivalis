# 🛠️ Corrigir erro `catatonit: failed to exec pid1` no Railway

## 🤔 O que aconteceu?
O Railway executa sua aplicação dentro de um container Linux usando o processo **catatonit** como PID 1. Esse erro aparece quando o comando de inicialização configurado no serviço aponta para um arquivo que não existe ou que não pode ser executado dentro do container (por exemplo, um script `.bat` do Windows ou um shell script com final de linha `CRLF`).

## ✅ Como corrigir

1. **Use o diretório raiz correto**
   - Em *Deployments › Build Settings*, defina **Root Directory** como `backend`.

2. **Ajuste os comandos**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   > Esses comandos rodam dentro de `/app/backend` durante o deploy.

3. **Evite scripts específicos do Windows**
   - Remova `start-backend.bat` ou `start.sh` do campo *Start Command*.
   - Se precisar de um shell script, adicione `#!/bin/bash` na primeira linha, salve com finais de linha `LF` e execute `chmod +x script.sh` antes de fazer commit.

4. **Salve e force um novo deploy**
   - Clique em **Deployments › Redeploy** depois de salvar as configurações.

5. **Execute a criação das tabelas (se necessário)**
   - No serviço do backend, use **One-off Commands** e rode `npm run init-db`.

## 🔍 Como verificar
- Abra os logs do serviço: você deve ver `Servidor Rivalis rodando na porta 5000` sem novas mensagens de erro.
- Acesse `https://<sua-url>.up.railway.app/health` para confirmar uma resposta `200`.

Se o erro persistir, copie o Start Command exato e os logs completos para analisarmos juntos.
