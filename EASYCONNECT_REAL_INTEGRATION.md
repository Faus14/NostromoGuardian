# 🔗 Nostromo Guardian + EasyConnect Integration

## Overview

**Nostromo Guardian** extends EasyConnect functionality by providing **real-time analytics and alerts** on top of QX smart contract data. While EasyConnect monitors raw QX transactions, Nostromo Guardian processes that data to detect:

- 🐋 **Whale movements** (large trades >10M QU)
- 📈 **Volume spikes** (50%+ increase vs 7-day average)
- 👥 **Holder surges** (20%+ growth in 24h)
- 🎯 **Custom alert conditions** (user-defined rules)
- 🏆 **Achievement unlocks** (gamification events)

This creates a **two-layer automation system**:
1. **EasyConnect** → Monitors raw QX blockchain events
2. **Nostromo Guardian** → Analyzes patterns and triggers intelligent alerts

---

## 🎯 Integration Architecture

```
┌─────────────────┐
│  Qubic QX SC    │  Raw transactions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EasyConnect    │  Basic event monitoring
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Nostromo DB     │  1,002+ indexed trades
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Alert Engine   │  Smart pattern detection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Webhooks      │  Real-time notifications
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Make.com / Zapier / n8n / Your App  │
└─────────────────────────────────┘
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Webhook Receiver in Make.com

1. Log into [Make.com](https://www.make.com)
2. Create **New Scenario**
3. Add **Webhooks → Custom Webhook** module
4. Click **Add** → Set name "Nostromo Alerts"
5. **Copy the webhook URL** (e.g., `https://hook.us1.make.com/abc123...`)

### Step 2: Register Webhook in Nostromo Guardian

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://hook.us1.make.com/YOUR_WEBHOOK_URL",
    "events": ["whale.buy", "volume.spike", "holder.surge"],
    "secret": "my-secure-secret-key"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://hook.us1.make.com/...",
    "events": ["whale.buy", "volume.spike", "holder.surge"],
    "active": true,
    "created_at": "2025-12-07T..."
  }
}
```

### Step 3: Test the Integration

```bash
# Test webhook delivery
curl -X POST http://localhost:3000/api/v1/webhooks/1/test
```

You should see a test notification in Make.com immediately! ✅

### Step 4: Build Your Automation

In Make.com, add modules after the webhook:
- **Google Sheets** → Log whale trades
- **Discord** → Send alerts to #whale-alerts
- **Telegram** → Notify community group
- **Email** → Send to premium subscribers

**Save and activate** the scenario → Done! 🎉

---

## 📊 Real-World Use Cases

### Use Case 1: Whale Alert Bot (Discord + Telegram)

**Goal:** Notify community instantly when whales trade >10M QU

**Make.com Scenario:**
1. **Webhook** → Receive `whale.buy` or `whale.sell` event
2. **Router** → Split by trade size:
   - 10-50M QU → Regular alert
   - 50-100M QU → Important alert
   - 100M+ QU → @everyone ping
3. **Discord** → Post to #whale-alerts
4. **Telegram** → Send to community group
5. **Google Sheets** → Log for analytics

**Nostromo Webhook Payload:**
```json
{
  "event_type": "whale.buy",
  "timestamp": "2025-12-07T14:30:00Z",
  "data": {
    "transaction_hash": "abcd1234...",
    "source_address": "QUBICABC123...",
    "dest_address": "QUBICXYZ789...",
    "amount": 15000000,
    "token_name": "QMINE",
    "tick": 15234567,
    "usd_value_estimate": 45000
  }
}
```

**Discord Message Example:**
```
🐋 WHALE ALERT!
━━━━━━━━━━━━━━━
💰 Amount: 15,000,000 QU
🪙 Token: QMINE
📊 Tick: 15,234,567
🔗 From: QUBICABC123...
➡️ To: QUBICXYZ789...
💵 Est. Value: $45,000

View on Explorer →
```

---

### Use Case 2: Auto-Airdrop on Holder Milestones

**Goal:** Reward all holders when token reaches 100, 500, 1000 holders

**Make.com Scenario:**
1. **Webhook** → Receive `holder.surge` event
2. **Router** → Branch by milestone:
   - **100 holders** → 1,000 tokens per holder
   - **500 holders** → 5,000 tokens + NFT badge
   - **1,000 holders** → 10,000 tokens + special role
3. **Google Sheets** → Log eligible addresses
4. **Telegram** → Announce milestone
5. **Airtable** → Create distribution records

**Nostromo Webhook Payload:**
```json
{
  "event_type": "holder.surge",
  "timestamp": "2025-12-07T15:00:00Z",
  "data": {
    "token_id": "QMINE",
    "token_name": "QMINE",
    "holder_count": 150,
    "previous_count": 120,
    "growth_percentage": 25,
    "milestone": 150,
    "holders": [
      {
        "address": "QUBIC123...",
        "balance": 1000000,
        "rank": 1
      }
    ]
  }
}
```

---

### Use Case 3: Live Trading Dashboard (Google Sheets)

**Goal:** Update Google Sheet every minute with top traders

**Make.com Scenario:**
1. **Schedule** → Run every 1 minute
2. **HTTP Request** → GET `http://your-api.com/api/v1/leaderboard/traders?period=24h`
3. **Iterator** → Loop through traders
4. **Google Sheets** → Update rows A2:G51
5. **Format** → Apply conditional formatting (top 3 = green)

**Result:** Live leaderboard that anyone can view!

---

### Use Case 4: Volume Spike Trading Signals

**Goal:** Alert traders when volume spikes 50%+ above average

**Make.com Scenario:**
1. **Webhook** → Receive `volume.spike` event
2. **Filter** → Only tokens you're watching
3. **Email** → Send to subscribers
4. **SMS (Twilio)** → Send to premium users
5. **Twitter** → Post public alert

**Nostromo Webhook Payload:**
```json
{
  "event_type": "volume.spike",
  "timestamp": "2025-12-07T16:00:00Z",
  "data": {
    "token_name": "QMINE",
    "volume_24h": 500000000,
    "volume_7d_avg": 250000000,
    "spike_percentage": 100,
    "reason": "Volume doubled in 24h",
    "trend": "bullish"
  }
}
```

---

### Use Case 5: Gamification Rewards System

**Goal:** Celebrate achievements and assign Discord roles

**Make.com Scenario:**
1. **Webhook** → Receive `achievement.unlocked` event
2. **Router** → Branch by rarity:
   - **Legendary** → Discord @everyone + Twitter post
   - **Epic** → Discord announcement
   - **Rare** → Discord message
   - **Common** → Silent log
3. **Discord** → Assign role based on badge
4. **Google Sheets** → Log achievement
5. **Airtable** → Update user profile

**Trigger Achievement Manually:**
```bash
curl -X POST http://localhost:3000/api/v1/events/badge-unlock \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "QUBICABC123...",
    "badge_id": "whale",
    "badge_name": "Whale Master",
    "badge_emoji": "🐋",
    "rarity": "legendary",
    "description": "Own 10%+ of any token supply"
  }'
```

---

## 📡 Available Events

| Event Type | Trigger Condition | Auto-Triggered | Manual Trigger |
|------------|-------------------|----------------|----------------|
| `whale.buy` | Trade >10M QU (buy) | ✅ Alert Engine | ❌ |
| `whale.sell` | Trade >10M QU (sell) | ✅ Alert Engine | ❌ |
| `volume.spike` | 24h volume >50% vs 7d avg | ✅ Alert Engine | ❌ |
| `holder.surge` | Holders +20% in 24h | ✅ Alert Engine | ❌ |
| `alert.triggered` | Custom alert rule met | ✅ Alert Engine | ✅ Test endpoint |
| `achievement.unlocked` | Badge earned | ❌ | ✅ POST `/events/badge-unlock` |

---

## 🔐 Webhook Security

### HMAC Signature Verification

All webhooks include `X-Webhook-Signature` header with HMAC-SHA256 signature.

**Verify in Make.com (JavaScript module):**
```javascript
const crypto = require('crypto');

const secret = 'your-secret-key';
const payload = JSON.stringify(input);
const receivedSignature = headers['X-Webhook-Signature'].replace('sha256:', '');

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid webhook signature!');
}

return input;
```

---

## 🛠️ API Endpoints Reference

### Webhook Management

```bash
# Register webhook
POST /api/v1/webhooks
Body: { "url": "...", "events": [...], "secret": "..." }

# List webhooks
GET /api/v1/webhooks

# Update webhook
PATCH /api/v1/webhooks/:id
Body: { "events": [...], "active": true }

# Test webhook
POST /api/v1/webhooks/:id/test

# Delete webhook
DELETE /api/v1/webhooks/:id
```

### Alert Management

```bash
# Create alert
POST /api/v1/alerts
Body: {
  "name": "Whale Alert",
  "event_type": "volume.spike",
  "conditions": { "threshold": 10000000 }
}

# List alerts
GET /api/v1/alerts

# Test alert
POST /api/v1/alerts/:id/test
```

### Manual Event Triggers

```bash
# Trigger badge unlock
POST /api/v1/events/badge-unlock
Body: { "address": "...", "badge_id": "...", ... }

# Trigger milestone
POST /api/v1/events/milestone-reached
Body: { "token_id": "...", "milestone": 100 }
```

### Data Export

```bash
# Export holders to CSV
GET /api/v1/exports/holders?token=QMINE&format=csv

# Export trades to JSON
GET /api/v1/exports/trades?token=QMINE&format=json

# Get leaderboard
GET /api/v1/leaderboard/traders?period=24h
```

---

## 📦 Make.com Templates

We provide **3 ready-to-use blueprints**:

### 1. Whale Alert → Discord + Telegram
**File:** `examples/make-templates/whale-alert-discord.json`

**Features:**
- Filters trades >10M QU
- Posts to Discord with rich embeds
- Sends Telegram notifications
- Logs to Google Sheets

**Import:** Create scenario → Import Blueprint → Upload file

---

### 2. Auto-Airdrop System
**File:** `examples/make-templates/auto-airdrop-holders.json`

**Features:**
- Detects holder milestones (100, 500, 1000)
- Calculates rewards per holder
- Sends Telegram announcements
- Logs distribution to Airtable

---

### 3. Gamification Rewards
**File:** `examples/make-templates/gamification-discord.json`

**Features:**
- Routes by badge rarity
- Assigns Discord roles
- Posts to Twitter for legendary badges
- Tracks achievements in Google Sheets

---

## 🎬 Video Tutorial

**Watch:** [Nostromo + EasyConnect Integration Demo](#) *(Coming soon)*

**Topics covered:**
1. Creating Make.com scenario
2. Registering webhook in Nostromo
3. Testing webhook delivery
4. Building multi-step automation
5. Deploying to production

---

## 🐛 Troubleshooting

### Webhook Not Receiving Data

**Check webhook status:**
```bash
curl http://localhost:3000/api/v1/webhooks/1
```

**Verify it's active:**
```json
{
  "active": true  // Should be true
}
```

**Test delivery manually:**
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/1/test
```

### Alert Engine Not Triggering

**Check Alert Engine is running:**
```bash
# Should show "Alert Engine started"
curl http://localhost:3000/api/v1/health
```

**View alert evaluation logs:**
```bash
tail -f logs/alert-engine.log
```

### Events Not in Make.com

1. **Check Make.com scenario is active** (green toggle)
2. **Verify webhook URL is correct**
3. **Test with curl:**
   ```bash
   curl -X POST https://hook.us1.make.com/YOUR_URL \
     -H 'Content-Type: application/json' \
     -d '{"test": true}'
   ```

---

## 📚 Additional Resources

- **EasyConnect Docs:** https://easy-academy.super.site/
- **Make.com Tutorial:** https://www.make.com/en/help
- **Nostromo API Docs:** `/README.md`
- **Example Scenarios:** `/examples/INTEGRATION_EXAMPLES.md`

---

## 💬 Support

**Questions? Issues?**
- Open an issue on GitHub
- Join our Discord community
- Email: support@nostromoguardian.io

---

**Made with ❤️ by Nostromo Guardian Team**  
**Powered by EasyConnect & Qubic Network**  
**Track 2: EasyConnect Integrations** 🏆
