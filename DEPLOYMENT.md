# 🚀 Nostromo Guardian - Quick Deploy Guide

## 🎯 One-Click Demo (For Judges)

### Live Demo URL
```
🌐 Frontend: https://nostromo-guardian.vercel.app
🔌 API: https://nostromo-api.railway.app
📚 Docs: https://github.com/[your-repo]/README.md
```

### Test Credentials (if applicable)
```
Email: demo@nostromoguardian.io
Password: Qubic2025!
```

---

## 💻 Local Setup (5 Minutes)

### Prerequisites
```bash
• Node.js 18+
• PostgreSQL 14+
• Git
```

### Clone & Install
```bash
# Clone repository
git clone https://github.com/[your-repo]/nostromo-guardian.git
cd nostromo-guardian

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### Database Setup
```bash
# Create database
createdb nostromo

# Run migrations
psql nostromo < src/database/schema.sql

# Seed with real data (optional)
npm run seed
```

### Environment Variables
Create `.env` in root:
```env
# Database
DATABASE_URL=postgresql://localhost:5432/nostromo

# API
PORT=3000
NODE_ENV=development

# Alert Engine
ALERT_ENGINE_ENABLED=true
ALERT_CHECK_INTERVAL=60000

# Qubic RPC
QUBIC_RPC_URL=https://rpc.qubic.org/
```

### Start Services
```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Alert Engine (optional)
npm run alert-engine
```

### Verify Installation
```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-07T..."}

# Open frontend
open http://localhost:5173
```

---

## ☁️ Production Deployment

### Option 1: Railway (Backend)

**Deploy API:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add -p postgresql

# Deploy
railway up

# Set environment variables
railway variables set ALERT_ENGINE_ENABLED=true
```

**Railway Config (`railway.json`):**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run api",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### Option 2: Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel --prod

# Configure environment variables
vercel env add VITE_API_URL production
# Enter: https://your-railway-api.up.railway.app
```

**Vercel Config (`frontend/vercel.json`):**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

---

### Option 3: Docker (All-in-One)

**Build & Run:**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

**`docker-compose.yml`:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: nostromo
      POSTGRES_USER: nostromo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      DATABASE_URL: postgresql://nostromo:${DB_PASSWORD}@postgres:5432/nostromo
      PORT: 3000
      ALERT_ENGINE_ENABLED: true
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres-data:
```

---

## 🧪 Testing Webhook Integration

### Step 1: Create Make.com Webhook
1. Go to [Make.com](https://www.make.com)
2. Create new scenario
3. Add **Webhooks → Custom Webhook**
4. Copy webhook URL

### Step 2: Register in Nostromo
```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://hook.us1.make.com/YOUR_WEBHOOK_ID",
    "events": ["whale.buy", "volume.spike"],
    "secret": "my-secure-secret"
  }'
```

### Step 3: Test Delivery
```bash
# Test webhook
curl -X POST http://localhost:3000/api/v1/webhooks/1/test

# Check Make.com - you should see test data!
```

### Step 4: Trigger Real Alert
```bash
# Create alert
curl -X POST http://localhost:3000/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Volume Spike Alert",
    "event_type": "volume.spike",
    "conditions": {
      "spike_threshold": 50
    },
    "enabled": true
  }'

# Alert Engine will evaluate every 60s
# When condition met → webhook fires automatically
```

---

## 🔍 Monitoring & Debugging

### Check Alert Engine Status
```bash
# API health
curl http://localhost:3000/api/v1/health

# List active alerts
curl http://localhost:3000/api/v1/alerts

# View alert history
curl http://localhost:3000/api/v1/alerts/1/history
```

### View Webhook Logs
```bash
# List webhooks
curl http://localhost:3000/api/v1/webhooks

# Check delivery status
curl http://localhost:3000/api/v1/webhooks/1/deliveries
```

### Database Queries
```bash
# Connect to database
psql nostromo

# View recent trades
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10;

# Check webhook deliveries
SELECT * FROM webhook_deliveries ORDER BY created_at DESC;

# View alert evaluations
SELECT * FROM alert_history ORDER BY evaluated_at DESC;
```

---

## 📊 Performance Optimization

### Database Indexes
```sql
-- Already included in schema.sql, but for reference:

CREATE INDEX idx_trades_timestamp ON trades(timestamp);
CREATE INDEX idx_trades_issuer ON trades(issuer_id);
CREATE INDEX idx_trades_source ON trades(source_public_id);
CREATE INDEX idx_trades_dest ON trades(dest_public_id);
```

### API Caching (Optional)
```javascript
// Add Redis for caching leaderboard queries
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache leaderboard for 5 minutes
app.get('/api/v1/leaderboard/traders', async (req, res) => {
  const cacheKey = `leaderboard:${req.query.period}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const data = await getLeaderboard(req.query.period);
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  res.json(data);
});
```

---

## 🛡️ Security Checklist

### Production Deployment:
- [ ] Change default database password
- [ ] Use strong webhook secrets (min 32 characters)
- [ ] Enable HTTPS (Vercel/Railway do this automatically)
- [ ] Set CORS to specific origins only
- [ ] Rate limit API endpoints
- [ ] Sanitize all user inputs
- [ ] Use environment variables (never commit secrets)
- [ ] Enable database connection pooling
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure database backups

### Example CORS Config:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://nostromo-guardian.vercel.app']
    : ['http://localhost:5173'],
  credentials: true
}));
```

---

## 📱 Mobile App (Future)

**React Native Setup:**
```bash
# Coming in Q1 2025
npx react-native init NostromoMobile
cd NostromoMobile

# Install dependencies
npm install @react-navigation/native axios

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

---

## 🆘 Troubleshooting

### Problem: "Database connection failed"
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials
psql $DATABASE_URL

# Reset database
dropdb nostromo && createdb nostromo
psql nostromo < src/database/schema.sql
```

### Problem: "Webhook not receiving data"
```bash
# Verify webhook is active
curl http://localhost:3000/api/v1/webhooks/1

# Check firewall/CORS
curl -X POST https://hook.us1.make.com/YOUR_ID \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

### Problem: "Alert Engine not triggering"
```bash
# Check Alert Engine is running
ps aux | grep alert-engine

# View logs
tail -f logs/alert-engine.log

# Manually trigger evaluation
curl -X POST http://localhost:3000/api/v1/alerts/1/test
```

---

## 📞 Support

**Issues?**
- GitHub Issues: [your-repo]/issues
- Discord: [community-invite]
- Email: support@nostromoguardian.io

**Response Time:**
- Critical (production down): 1 hour
- High (feature broken): 4 hours
- Normal (questions): 24 hours

---

**Built with ❤️ for Qubic Hackathon 2025**
