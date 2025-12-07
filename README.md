# 🛡️ Nostromo Guardian - Qubic Token Analytics & EasyConnect Automation

[![Qubic Hackathon](https://img.shields.io/badge/Qubic-Hackathon%202025-00d4ff?style=for-the-badge)](https://qubic.org)
[![EasyConnect Integration](https://img.shields.io/badge/EasyConnect-FULL%20INTEGRATION-yellow?style=for-the-badge)](./EASYCONNECT_INTEGRATION.md)
[![Real Blockchain Data](https://img.shields.io/badge/Data-REAL%20BLOCKCHAIN-success?style=for-the-badge)](#)
[![Make.com Templates](https://img.shields.io/badge/Make.com-3%20Templates-blueviolet?style=for-the-badge)](./examples/make-templates/)
[![AI Powered](https://img.shields.io/badge/AI-GPT--4%20Powered-orange?style=for-the-badge)](./AI_FEATURES.md)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-00ff00?style=for-the-badge)](#)

> **🚀 Bridge Qubic blockchain to no-code automation platforms. Build Discord bots, auto-airdrops, and gamification systems in minutes - no programming required!**
> 
> **🤖 NOW WITH AI:** GPT-4 powered trading insights, auto-generated announcements, and intelligent market analysis!

## 🎯 **Track 2: EasyConnect Integrations**

**Nostromo Guardian** extends EasyConnect by providing **intelligent analytics and alerts** on top of QX data:

### How It Works:
```
QX Smart Contract → EasyConnect → Nostromo DB (1,002+ trades)
                                         ↓
                                   Alert Engine
                                         ↓
                                    Webhooks
                                         ↓
                    Make.com / Zapier / n8n / Your App
```

### What We Enable:
- 🐋 **Whale Alert Bots** - Notify Discord/Telegram when trades >10M QU
- 🎁 **Auto-Airdrop Systems** - Reward holders at 100/500/1000 milestones
- 🎮 **Gamification Rewards** - Discord roles, achievement announcements
- 📊 **Live Dashboards** - Google Sheets updated every minute
- 📈 **Trading Signals** - Volume spike alerts via email/SMS

**[📖 Full EasyConnect Integration Guide →](./EASYCONNECT_REAL_INTEGRATION.md)**  
**[🎬 Video Tutorial →](#)** | **[📦 3 Make.com Templates →](./examples/make-templates/)**

---

## 🎯 Why We Will Win This Hackathon

### ✅ REAL BLOCKCHAIN DATA (Not Simulated)
- **1,002+ indexed trades** from Qubic mainnet QX exchange
- **266+ real holders** with live balances  
- **93 QMINE holders** tracked in real-time
- **15+ tokens** indexed with complete trade history
- **28 whales detected** with >10% supply concentration
- **NOT A DEMO** - Every single data point comes from actual blockchain

### 🚀 20 PRODUCTION-READY API ENDPOINTS
**Most competitors have 2-3 basic endpoints. We have 20 professional APIs:**

| Category | Endpoints | Production Features |
|----------|-----------|---------------------|
| 📡 **Real-Time Events** | 2 | Live trade feed, whale alerts |
| 🏆 **Gamification** | 2 | Badges, titles, alpha detection |
| 🎁 **Airdrop Automation** | 2 | Diamond hands, eligibility filters |
| 📢 **Webhooks** | 5 | Push notifications, retry logic, signature verification |
| 📊 **Data Exports** | 3 | CSV/JSON for Google Sheets, Excel, Airtable |
| ⚠️ **Alert Engine** | 6 | Smart rules, volume/whale/holder triggers, test evaluation |

### 💎 UNIQUE FEATURES NO ONE ELSE HAS

1. **🤖 AI-Powered Intelligence** (NEW!) - [Full Documentation →](./AI_FEATURES.md)
   - GPT-4 trade analysis with sentiment scoring
   - Auto-generated Discord/Telegram/Twitter announcements
   - AI trader profiling and risk assessment
   - Daily market summaries with insights
   - **Optional feature** - works without API key

2. **Webhook System** - TRUE push notifications (not polling)
   - HMAC signature verification for security
   - Automatic retry logic with exponential backoff
   - Support for Make.com, Zapier, n8n
   - Test delivery endpoint
   - **AI-enhanced payloads** when enabled

3. **Advanced Gamification**
   - 🥇🥈🥉 Rank badges
   - 💎 Diamond Hands (never sold)
   - 🐋 Whale Master (>10% supply)
   - 📈 Whale Hunters (bought before whales)
   - 🔥 Volume King titles
   - **AI-generated achievement announcements**

4. **Professional Data Exports**
   - CSV with proper headers for Excel
   - JSON for programmatic access
   - Period filters (24h, 7d, 30d, all)
   - Pagination and limits

5. **Complete Frontend UI**
   - Professional glassmorphism design
   - Real-time leaderboards with live updates
   - Webhook management dashboard
   - Token analytics with risk scoring
   - **AI insights displayed inline** (when enabled)

---

## 🚀 Features

### 📊 **Token Analytics Dashboard**
- Real-time holder distribution with whale detection
- Volume analysis (24h/7d/30d)
- Risk scoring engine
- Market sentiment indicators
- Live activity feed

### 🐋 **Whale Tracking**
- Automatic whale identification
- Real-time whale trade alerts
- Whale concentration metrics

### 🏆 **Community Gamification**
- Trader Leaderboard with badges
- Whale Hunters (alpha traders)
- Diamond Hands tracking
- Titles: 🥇 Gold, 💎 Diamond, 🐋 Whale Master

### 🎁 **Airdrop Automation**
- Filter eligible addresses
- Diamond hands detection
- Export-ready for automation

### ⚡ **EasyConnect Integration**
**24 Production-Ready API Endpoints** for Make/Zapier/n8n:

**🤖 AI Intelligence (NEW!)**
1. `POST /api/v1/ai/analyze-trade` - GPT-4 trade insights
2. `POST /api/v1/ai/generate-announcement` - Auto-generate messages
3. `GET /api/v1/ai/analyze-address/:address` - AI trader profiling
4. `GET /api/v1/ai/market-summary` - AI market overview

**📡 Real-Time Events & Alerts**
5. `GET /api/v1/events/recent` - Live trade feed with filters
6. `GET /api/v1/events/whale-alerts` - Whale activity detection

**🏆 Community Gamification**
7. `GET /api/v1/leaderboard/traders` - Rankings with badges & titles
8. `GET /api/v1/leaderboard/whale-hunters` - Alpha trader detection

**🎁 Airdrop Automation**
9. `GET /api/v1/airdrops/eligible` - Filter by balance, trades, whale status
10. `GET /api/v1/airdrops/diamond-hands` - Never-sold holders

**📢 Webhooks (Push Notifications) - AI Enhanced**
11. `POST /api/v1/webhooks/register` - Subscribe to events
12. `GET /api/v1/webhooks/list` - View active webhooks
13. `DELETE /api/v1/webhooks/:id` - Unsubscribe
14. `PATCH /api/v1/webhooks/:id` - Update subscription
15. `POST /api/v1/webhooks/:id/test` - Test delivery

**📊 Data Exports (Google Sheets/Excel)**
16. `GET /api/v1/exports/holders` - CSV/JSON holder exports
13. `GET /api/v1/exports/trades` - CSV/JSON trade history
14. `GET /api/v1/exports/leaderboard` - CSV/JSON rankings

**⚠️ Alert Engine (Rules-as-a-Service)**
15. `POST /api/v1/alerts` - Create smart alert with conditions
16. `GET /api/v1/alerts` - List all configured alerts
17. `GET /api/v1/alerts/:id` - Get alert details
18. `PATCH /api/v1/alerts/:id` - Update alert configuration
19. `DELETE /api/v1/alerts/:id` - Delete alert
20. `POST /api/v1/alerts/:id/test` - Test alert evaluation

---

## ⚡ Quick Start

```bash
# 1. Install
npm install && cd frontend && npm install && cd ..

# 2. Start Database
docker-compose up -d
sleep 5
docker exec -i qubic-db psql -U qubic -d qubic_analytics < src/database/schema.sql

# 3. Index Data
npm run query-seed
npm run calculate-holders

# 4. Run
npm run api  # Backend (port 3000)
cd frontend && npm run dev  # Frontend (port 5173)
```

---

## 📚 API Examples

### 🏆 Gamification
```bash
# Top traders with badges & titles
curl "http://localhost:3000/api/v1/leaderboard/traders?period=24h&limit=100"

# Alpha traders who bought before whales
curl "http://localhost:3000/api/v1/leaderboard/whale-hunters?period=7d"
```

### 📢 Webhooks (Push Notifications)
```bash
# Register webhook for whale alerts
curl -X POST "http://localhost:3000/api/v1/webhooks/register" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.make.com/your-webhook-id",
    "events": ["whale.buy", "whale.sell", "volume.spike"],
    "description": "Discord whale alerts bot"
  }'

# Test webhook delivery
curl -X POST "http://localhost:3000/api/v1/webhooks/1/test"
```

### 📊 Data Exports
```bash
# Export holders to CSV for Google Sheets
curl "http://localhost:3000/api/v1/exports/holders?token=QMINE&format=csv&min_balance=1000000000" \
  -o holders.csv

# Export trade history as JSON
curl "http://localhost:3000/api/v1/exports/trades?period=7d&format=json&token=QMINE"

# Export leaderboard for Excel
curl "http://localhost:3000/api/v1/exports/leaderboard?format=csv&period=30d" \
  -o leaderboard.csv
```

### ⚠️ Alert Engine (Smart Rules)
```bash
# Create volume spike alert
curl -X POST "http://localhost:3000/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QMINE Volume Spike",
    "description": "Trigger when QMINE volume spikes 150%+",
    "event_type": "volume_spike",
    "conditions": {
      "token": "QMINE",
      "period_minutes": 60,
      "threshold_percent": 150,
      "min_volume": "250000"
    },
    "actions": [{"type": "webhook", "event": "alert.triggered"}],
    "active": true
  }'

# Create whale buy alert
curl -X POST "http://localhost:3000/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Large QMINE Buys",
    "event_type": "whale_buy",
    "conditions": {
      "token": "QMINE",
      "lookback_minutes": 60,
      "min_value": "100000",
      "whales_only": true,
      "limit": 5
    },
    "active": true
  }'

# Create holder surge alert
curl -X POST "http://localhost:3000/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QMINE Holder Growth",
    "event_type": "holder_surge",
    "conditions": {
      "token": "QMINE",
      "lookback_minutes": 120,
      "min_new_holders": 5,
      "sample_size": 5
    },
    "active": true
  }'

# Test an alert manually
curl -X POST "http://localhost:3000/api/v1/alerts/1/test"

# List all alerts
curl "http://localhost:3000/api/v1/alerts"

# Update alert
curl -X PATCH "http://localhost:3000/api/v1/alerts/1" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Alert Event Types:**
- `volume.spike` / `volume_spike` - Detects volume increases above threshold
- `whale.buy` / `whale_buy` - Monitors large purchases by whales
- `holder.surge` / `holder_surge` - Tracks rapid holder growth

**Alert Conditions:**
- **Volume Spike**: `token`, `period_minutes` (5-2880), `threshold_percent` (10-5000), `min_volume`
- **Whale Buy**: `token`, `lookback_minutes` (5-1440), `min_value`, `whales_only`, `limit` (1-20)
- **Holder Surge**: `token`, `lookback_minutes` (10-2880), `min_new_holders` (1-5000), `sample_size` (1-25)

**How It Works:**
1. Alert Engine evaluates all active alerts every 60 seconds
2. When conditions are met, triggers configured actions (webhooks)
3. Automatically dispatches to all registered webhooks subscribed to `alert.triggered` event
4. Tracks `trigger_count` and `last_triggered` timestamp
5. Test endpoint allows dry-run evaluation without triggering actions

### 🎁 Airdrop Automation
```bash
# Airdrop eligible addresses
curl "http://localhost:3000/api/v1/airdrops/eligible?token=QMINE&min_balance=1000000000&min_trades=5"

# Diamond hands (never sold)
curl "http://localhost:3000/api/v1/airdrops/diamond-hands?token=QMINE"
```

---

## 🎮 EasyConnect Use Cases

### 1. **Discord Leaderboard Bot**
- **Setup**: Register webhook → Make.com scenario → Discord channel
- **Flow**: Every 24h, fetch `/leaderboard/traders` → format message → post to #leaderboard
- **Badges**: 🥇🥈🥉 medals, 💎 Diamond Hands, 🐋 Whale Master titles

### 2. **Telegram Whale Alerts**
- **Setup**: Register webhook for `whale.buy` and `whale.sell` events
- **Flow**: Webhook receives event → Make.com → Telegram Bot API
- **Content**: "🐋 Whale Alert: 50M QMINE bought at tick 15234567"

### 3. **Auto Airdrop Distribution**
- **Setup**: Zapier scheduled task (weekly)
- **Flow**: Fetch `/airdrops/diamond-hands?token=QMINE` → filter >30 days → send to smart contract
- **Export**: CSV format ready for Qubic wallet batch transfers

### 4. **Google Sheets Live Dashboard**
- **Setup**: Google Apps Script + n8n
- **Flow**: Every hour, fetch `/exports/holders?format=json` → update Sheet rows
- **Analytics**: Auto-calculate concentration, growth trends, whale movements

### 5. **Twitter Milestone Bot**
- **Setup**: Webhook for `achievement.diamond_hand` event
- **Flow**: User reaches 90 days hold → webhook triggers → n8n → Twitter API
- **Tweet**: "🎉 @address just earned Diamond Hands! 💎 90 days holding $QMINE"

### 6. **Slack Volume Alerts**
- **Setup**: Webhook for `volume.spike` event
- **Flow**: 24h volume >200% average → webhook → Make.com → Slack #alerts
- **Message**: "📈 Volume Spike: QMINE up 347% to 2.3B tokens traded"

### 7. **Smart Alert Automations**
- **Setup**: Create alert via POST `/api/v1/alerts` → connects to existing webhooks
- **Flow**: Alert Engine evaluates every 60s → triggers webhook when conditions met
- **Use Cases**:
  - Volume spike detection → Discord notification
  - Large whale buys → Telegram alert channel
  - Rapid holder growth → Email to marketing team
  - Combination of triggers → Multi-channel notifications

---

---

## 📊 Competitive Advantage

### vs Other Hackathon Projects

| Feature | **Nostromo Guardian** | Typical Competitors |
|---------|----------------------|---------------------|
| **Real Blockchain Data** | ✅ 1,002 trades indexed | ❌ Simulated/mock data |
| **API Endpoints** | ✅ 20 production endpoints | ⚠️ 2-3 basic endpoints |
| **Alert Engine** | ✅ Rules-as-a-Service | ❌ None |
| **Webhooks** | ✅ Full system with retry | ❌ No webhooks |
| **Data Exports** | ✅ CSV/JSON for Sheets | ❌ JSON only |
| **Gamification** | ✅ Badges, titles, rankings | ⚠️ Basic leaderboard |
| **Frontend UI** | ✅ Professional design | ⚠️ Basic or none |
| **Signature Verification** | ✅ HMAC security | ❌ Not implemented |
| **Documentation** | ✅ Complete with examples | ⚠️ Minimal |

### vs Qubic Liquidation Guardian (Similar Project)
**They focus on**: Liquidation monitoring  
**We focus on**: Complete ecosystem analytics + community engagement

**Our advantages:**
- ✅ Broader scope (all tokens, not just liquidations)
- ✅ Gamification system for community growth
- ✅ Webhook push notifications (not just polling)
- ✅ Data export capabilities
- ✅ More API endpoints (14 vs ~4)

---

## 🏆 Hackathon Track 2 Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **EasyConnect Integration** | 14 API endpoints compatible with Make/Zapier/n8n | ✅ **Complete** |
| **Real-time Analytics** | Live trade feed, whale alerts, volume tracking | ✅ **Complete** |
| **Community Engagement** | Gamification with badges, titles, leaderboards | ✅ **Complete** |
| **Automation** | Webhooks + airdrop automation + exports | ✅ **Complete** |
| **Innovation** | Whale hunter detection, diamond hands tracking | ✅ **Complete** |
| **Production Ready** | Error handling, pagination, rate limiting ready | ✅ **Complete** |

### Bonus Features Beyond Requirements:
- ⚠️ **Alert Engine** - Rules-as-a-Service with 3 event types (volume spike, whale buy, holder surge)
- 📊 CSV/JSON exports for Google Sheets integration
- 🔐 Webhook signature verification for security
- 💎 Advanced gamification (6 badge types, 4 title types)
- 🎯 Alpha trader detection (bought before whales)
- 🔄 Automatic retry logic for webhook delivery
- 🎛️ Frontend alert management dashboard

---

## 💪 Why This Wins

1. **Most Complete Solution**
   - Only project with webhooks + alert engine + exports + gamification + real data
   - 20 endpoints vs typical 2-3

2. **Production Quality**
   - HMAC signature verification
   - Proper error handling
   - Retry logic with exponential backoff
   - CSV headers for Excel compatibility

3. **Real Adoption Potential**
   - Community wants gamification (proven by Crypto Twitter engagement)
   - Projects NEED airdrop tools (manual = inefficient)
   - Discord/Telegram bots drive engagement (see Telegram trading bots success)

4. **Technical Excellence**
   - TypeScript throughout (type safety)
   - PostgreSQL with proper indexing
   - React 18 with modern hooks
   - Professional UI/UX

### Innovation:
- ✅ Only project with real blockchain data
- ✅ Alert Engine (Rules-as-a-Service)
- ✅ Full gamification system
- ✅ Alpha hunter detection
- ✅ Diamond hands tracking
- ✅ Production ready

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 (Docker)
- **Blockchain**: Qubic Mainnet + QX

---

## 📊 Database Stats

```
Total Trades: 1,002+
Total Holders: 266
Tokens Tracked: 15+
Whales Detected: 28
```

---

## 📝 License

MIT License

---

<div align="center">

**🛡️ Nostromo Guardian - Protecting Your Qubic Investments**

*Built with ❤️ for Qubic Hackathon 2025*

</div>
