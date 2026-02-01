# Crypto AI Trading Backend - Setup Guide

Schritt-für-Schritt Anleitung zum Einrichten und Starten der Crypto AI Trading App.

## Schnellstart (5 Minuten)

### Option 1: Lokal mit Node.js (Empfohlen für Entwicklung)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank-Migrations ausführen
npm run db:migrate

# 3. Server starten
npm run dev
```

Server läuft dann auf: **http://localhost:3001**

### Option 2: Docker (Empfohlen für Produktion)

```bash
# 1. Docker Images bauen und starten
docker-compose up -d

# 2. Datenbank-Migrations ausführen
docker-compose exec backend npx prisma migrate deploy

# 3. Server läuft auf http://localhost:3001
```

---

## Detaillierte Setup-Anleitung

### Voraussetzungen

- **Node.js**: 18+ (für lokale Entwicklung)
- **PostgreSQL**: 12+ (lokal oder Docker)
- **npm**: 8+ oder yarn
- **Docker & Docker Compose**: (optional, nur für Docker-Deployment)

### Schritt 1: Repository klonen/navigieren

```bash
cd /home/code/crypto-ai-backend
```

### Schritt 2: Abhängigkeiten installieren

```bash
npm install
```

Dies installiert alle erforderlichen Pakete:
- Express.js (Web Framework)
- Prisma (Database ORM)
- Xenova/Transformers (AI Models)
- CoinGecko API Client
- Sentiment Analysis Libraries

### Schritt 3: Umgebungsvariablen konfigurieren

**Option A: Lokal mit existierender PostgreSQL**

```bash
# .env.local erstellen
cp .env.example .env.local

# Datei bearbeiten und folgende Werte setzen:
# DATABASE_URL="postgresql://sandbox:o6SOj3uGZcZNcDZhFhDkjTiN@localhost:5432/crypto_ai_db"
# PORT=3001
```

**Option B: Mit Docker (PostgreSQL wird automatisch gestartet)**

```bash
# .env.local erstellen
cp .env.example .env.local

# Keine Änderungen nötig - Docker Compose kümmert sich um die Datenbank
```

### Schritt 4: Datenbank einrichten

**Option A: Lokal mit existierender PostgreSQL**

```bash
# 1. Datenbank erstellen (falls nicht vorhanden)
createdb -h localhost -U sandbox crypto_ai_db

# 2. Prisma Migrations ausführen
npm run db:migrate

# 3. Prisma Client generieren
npx prisma generate
```

**Option B: Mit Docker**

```bash
# 1. Docker Container starten
docker-compose up -d

# 2. Warten bis PostgreSQL bereit ist (ca. 10 Sekunden)
sleep 10

# 3. Migrations ausführen
docker-compose exec backend npx prisma migrate deploy

# 4. Fertig! Backend läuft auf http://localhost:3001
```

### Schritt 5: Server starten

**Entwicklungsmodus (mit Auto-Reload)**

```bash
npm run dev
```

**Produktionsmodus**

```bash
npm start
```

**Debug-Modus (mit Node Inspector)**

```bash
npm run dev:debug
# Debugger öffnet sich auf chrome://inspect
```

---

## Verifikation

### Health Check

```bash
curl http://localhost:3001/health
```

Erwartete Antwort:
```json
{
  "status": "ok",
  "timestamp": "2024-02-01T12:00:00.000Z",
  "uptime": 123.456
}
```

### API Documentation

Öffne im Browser: **http://localhost:3001/**

Dies zeigt alle verfügbaren API Endpoints.

### Erste Prediction generieren

```bash
curl -X POST http://localhost:3001/api/predictions/generate/bitcoin
```

---

## Datenbank Management

### Prisma Studio (Datenbank Browser)

```bash
npm run db:studio
```

Öffnet interaktiven Datenbank-Browser auf **http://localhost:5555**

### Neue Migration erstellen

```bash
npm run db:migrate
```

Folge den Prompts um eine neue Migration zu erstellen.

### Datenbank zurücksetzen (Entwicklung nur!)

```bash
npx prisma migrate reset
```

⚠️ **WARNUNG**: Dies löscht alle Daten! Nur in Entwicklung verwenden.

---

## Docker Deployment

### Docker Compose starten

```bash
# Alle Services starten
docker-compose up -d

# Logs anschauen
docker-compose logs -f backend

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v
```

### Docker Image manuell bauen

```bash
docker build -t crypto-ai-backend:latest .
```

### Docker Container manuell starten

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  crypto-ai-backend:latest
```

---

## Troubleshooting

### Problem: "Cannot find module '@prisma/client'"

**Lösung**:
```bash
npm install
npx prisma generate
```

### Problem: "Database connection refused"

**Überprüfe**:
1. PostgreSQL läuft: `psql -h localhost -U sandbox -d crypto_ai_db`
2. DATABASE_URL in .env.local korrekt
3. Datenbank existiert: `createdb -h localhost -U sandbox crypto_ai_db`

### Problem: "Port 3001 already in use"

**Lösung**:
```bash
# Prozess auf Port 3001 beenden
lsof -ti:3001 | xargs kill -9

# Oder anderen Port verwenden
PORT=3002 npm run dev
```

### Problem: "Sentiment model not loading"

**Ursachen**:
- Erste Anfrage dauert länger (Model wird heruntergeladen ~268MB)
- Nicht genug Speicherplatz
- Keine Internetverbindung

**Lösung**:
- Warten Sie 30-60 Sekunden bei erster Anfrage
- Überprüfen Sie Speicherplatz: `df -h`
- Überprüfen Sie Internetverbindung

### Problem: "CoinGecko API rate limit exceeded"

**Lösung**:
- Warten Sie 1-2 Minuten
- Reduzieren Sie Anfrage-Frequenz
- Verwenden Sie Batch-Endpoints für mehrere Cryptos

---

## Konfiguration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crypto_ai_db"

# Server
PORT=3001
NODE_ENV=development

# CoinGecko API
COINGECKO_API_TIMEOUT=10000
RATE_LIMIT_DELAY=100

# AI Model
AI_MODEL_NAME="Xenova/distilbert-base-uncased-finetuned-sst-2-english"

# Logging
LOG_LEVEL=info
```

### Performance Tuning

**Für Produktion**:
```bash
# NODE_ENV auf production setzen
NODE_ENV=production npm start

# Mehr Worker Processes (wenn verfügbar)
# Verwende PM2 oder ähnliches für Process Management
```

---

## API Endpoints Testen

### Alle Cryptocurrencies abrufen

```bash
curl "http://localhost:3001/api/cryptocurrencies?limit=10"
```

### Bitcoin Details abrufen

```bash
curl "http://localhost:3001/api/cryptocurrencies/bitcoin"
```

### Sentiment analysieren

```bash
curl -X POST http://localhost:3001/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin is looking bullish with strong technical indicators",
    "cryptoSymbol": "BTC"
  }'
```

### Batch Predictions generieren

```bash
curl -X POST http://localhost:3001/api/predictions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoIds": ["bitcoin", "ethereum", "cardano"]
  }'
```

---

## Entwicklung

### Code Structure

```
src/
├── server.js              # Main Express server
├── utils/
│   └── db.js             # Prisma client singleton
├── services/
│   ├── coingeckoService.js    # CoinGecko API integration
│   ├── aiService.js           # AI/ML analysis
│   └── predictionService.js   # Prediction generation
└── routes/
    ├── predictions.js     # Prediction endpoints
    ├── cryptocurrencies.js # Crypto data endpoints
    └── sentiment.js       # Sentiment analysis endpoints
```

### Neue Features hinzufügen

1. **Neue Route erstellen**: `src/routes/newfeature.js`
2. **Service implementieren**: `src/services/newfeatureService.js`
3. **In server.js registrieren**: `app.use('/api/newfeature', newfeatureRouter)`
4. **Testen**: `curl http://localhost:3001/api/newfeature`

### Code Style

- **TypeScript**: Nicht verwendet (CommonJS JavaScript)
- **Linting**: Keine automatische Linting konfiguriert
- **Formatting**: Verwende Prettier oder ähnliches
- **Comments**: Dokumentiere komplexe Logik

---

## Deployment

### Vercel (Empfohlen für Node.js)

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Projekt deployen
vercel

# 3. Environment Variables setzen
vercel env add DATABASE_URL
```

### Heroku

```bash
# 1. Heroku CLI installieren
# 2. Login
heroku login

# 3. App erstellen
heroku create crypto-ai-backend

# 4. Database URL setzen
heroku config:set DATABASE_URL="postgresql://..."

# 5. Deployen
git push heroku main
```

### Railway

```bash
# 1. Railway CLI installieren
npm i -g @railway/cli

# 2. Login
railway login

# 3. Projekt initialisieren
railway init

# 4. Deployen
railway up
```

### AWS EC2

```bash
# 1. SSH in EC2 Instance
ssh -i key.pem ec2-user@instance-ip

# 2. Node.js installieren
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. Repository klonen
git clone <repo-url>
cd crypto-ai-backend

# 4. Setup
npm install
npm run db:migrate

# 5. PM2 installieren für Process Management
npm i -g pm2
pm2 start src/server.js --name "crypto-ai"
pm2 startup
pm2 save
```

---

## Monitoring & Logging

### Server Logs anschauen

```bash
# Lokal
npm run dev

# Docker
docker-compose logs -f backend

# PM2
pm2 logs crypto-ai
```

### Health Check

```bash
# Regelmäßig testen
watch -n 5 'curl -s http://localhost:3001/health | jq .'
```

### Performance Monitoring

```bash
# Node.js built-in profiler
node --prof src/server.js

# Analysieren
node --prof-process isolate-*.log > profile.txt
```

---

## Sicherheit

### Best Practices

1. **Environment Variables**: Niemals API Keys in Code committen
2. **CORS**: Konfiguriert für localhost, anpassen für Produktion
3. **Rate Limiting**: Implementiert für CoinGecko API
4. **Input Validation**: Verwende Prisma für SQL Injection Prevention
5. **Error Handling**: Keine sensitiven Infos in Error Messages

### Produktion Checklist

- [ ] NODE_ENV=production
- [ ] DATABASE_URL auf Production DB setzen
- [ ] CORS Origins konfigurieren
- [ ] Rate Limiting erhöhen
- [ ] Logging aktivieren
- [ ] Error Monitoring (Sentry, etc.)
- [ ] SSL/TLS aktivieren
- [ ] Backups konfigurieren

---

## Support & Weitere Ressourcen

- **Prisma Docs**: https://www.prisma.io/docs/
- **Express Docs**: https://expressjs.com/
- **CoinGecko API**: https://www.coingecko.com/en/api
- **Xenova/Transformers**: https://xenova.github.io/transformers.js/

---

**Viel Erfolg mit der Crypto AI Trading App! 🚀**
