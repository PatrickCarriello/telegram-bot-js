# telegram-bot-js
Telegram Bot Javascript

# Preparação
- Crie o arquivo env:
```
cp example.env .env
```
Obs.: é necessário preencher esse arquivo com seus dados.

- Execute a instalação dos pacotes:
```
npm install
```

# Execução
- Para executar o código:
```
npm run start
```

# Rotas
```
curl --location 'http://localhost:3005/' \
--header 'Content-Type: application/json' \
--data '{
    "message": "Teste"
}'
```
