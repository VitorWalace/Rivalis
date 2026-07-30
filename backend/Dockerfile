# Debian slim em vez de Alpine: o sqlite3 publica binários pré-compilados para
# glibc, mas não para musl. No Alpine o npm cairia no node-gyp e o build falharia
# por falta de python3/make/g++.
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Diretório padrão para o arquivo SQLite. Monte um volume persistente aqui,
# senão o banco é recriado vazio a cada deploy.
ENV SQLITE_PATH=/data/database.sqlite
RUN mkdir -p /data

EXPOSE 5000

CMD ["npm", "start"]
