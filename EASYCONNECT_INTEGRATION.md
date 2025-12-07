# 🔗 EasyConnect Integration Guide

## What is EasyConnect?

**EasyConnect** is a no-code bridge that connects Qubic blockchain events to automation platforms like **Make.com**, **Zapier**, and **n8n**. Created by Kairos (previous Qubic hackathon winners), it allows anyone to build dApps and automations without writing code.

**Nostromo Guardian** provides a complete **Alert Engine** and **Webhook System** that integrates seamlessly with EasyConnect for real-time blockchain automation.

---

## 🎯 Use Cases

### 1. **Whale Alert System** 
Automatically notify your community when large transactions occur:
- Discord notifications for trades >10M QU
- Telegram alerts for whale movements
- Twitter posts for legendary trades
- Email alerts to premium subscribers

### 2. **Auto-Airdrop System**
Reward token holders automatically when milestones are reached:
- Airdrop 1,000 tokens when reaching 100 holders
- NFT badges for early supporters
- Bonus rewards for top traders
- Automated referral rewards

### 3. **Gamification Engine**
Build community engagement with automated rewards:
- Discord role assignments based on badges
- Leaderboard updates every hour
- Achievement announcements
- Tournament prize distributions

### 4. **Market Intelligence**
Create data-driven tools for traders:
- Google Sheets with real-time holder data
- Volume spike alerts
- Price movement notifications
- Holder growth tracking dashboards

### 5. **Community Management**
Automate community operations:
- Welcome messages for new token holders
- Activity streak rewards
- Monthly trader summaries
- Community treasury reports

---

## 📡 Available Webhook Events

Nostromo Guardian emits these events that can trigger Make/Zapier workflows:

| Event Type | Description | Use Case |
|------------|-------------|----------|
| `whale.buy` | Large buy transaction detected (>10M QU) | Alert community, track whales |
| `whale.sell` | Large sell transaction detected | Market sentiment analysis |
| `volume.spike` | 24h volume exceeds 7d average by 50%+ | Trading signals, opportunity alerts |
| `holder.surge` | Token holders increased 20%+ in 24h | Growth tracking, milestone rewards |
| `alert.triggered` | Custom alert condition met | Personalized notifications |
| `alert.failed` | Alert evaluation error | System monitoring |

---

## 🚀 Quick Start: Make.com Integration

### Step 1: Create Webhook in Nostromo Guardian

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://hook.us1.make.com/YOUR_WEBHOOK_ID",
    "events": ["whale.buy", "volume.spike", "holder.surge"],
    "secret": "your-secret-key-here"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://hook.us1.make.com/YOUR_WEBHOOK_ID",
    "events": ["whale.buy", "volume.spike", "holder.surge"],
    "secret_hash": "sha256:...",
    "active": true,
    "retry_count": 3
  }
}
```

### Step 2: Import Make.com Template

1. Go to [Make.com](https://www.make.com)
2. Create new scenario
3. Import one of our templates:
   - `examples/make-templates/whale-alert-discord.json` - Whale notifications
   - `examples/make-templates/auto-airdrop-holders.json` - Milestone airdrops
   - `examples/make-templates/gamification-discord.json` - Badge rewards

### Step 3: Configure Connections

**Discord Webhook:**
1. Go to Discord Server Settings → Integrations → Webhooks
2. Create New Webhook
3. Copy webhook URL
4. Paste in Make.com Discord module

**Telegram Bot:**
1. Talk to [@BotFather](https://t.me/BotFather)
2. Create new bot with `/newbot`
3. Copy bot token
4. Add bot to your channel
5. Configure in Make.com

**Google Sheets:**
1. Create Google Sheet
2. Authorize Make.com access
3. Select spreadsheet and sheet name

### Step 4: Test the Integration

```bash
# Trigger a test webhook
curl -X POST http://localhost:3000/api/v1/webhooks/1/test \
  -H 'Content-Type: application/json'
```

You should see a message in Discord/Telegram within seconds! ✅

---

## 📊 Webhook Payload Structure

### Whale Buy Event
```json
{
  "event_type": "whale.buy",
  "timestamp": "2025-12-07T10:30:00Z",
  "data": {
    "transaction_hash": "abcd1234...",
    "source_address": "QUBICABCD1234...",
    "dest_address": "QUBICXYZ789...",
    "amount": 15000000,
    "tick": 15234567,
    "token_id": "TOKEN123",
    "usd_value": 45000
  },
  "metadata": {
    "webhook_id": 1,
    "retry_count": 0,
    "signature": "sha256:..."
  }
}
```

### Volume Spike Event
```json
{
  "event_type": "volume.spike",
  "timestamp": "2025-12-07T11:00:00Z",
  "data": {
    "token_id": "TOKEN123",
    "token_name": "Qubic Coin",
    "volume_24h": 500000000,
    "volume_7d_avg": 250000000,
    "spike_percentage": 100,
    "reason": "Volume doubled in 24h"
  }
}
```

### Holder Surge Event
```json
{
  "event_type": "holder.surge",
  "timestamp": "2025-12-07T12:00:00Z",
  "data": {
    "token_id": "TOKEN123",
    "token_name": "Qubic Coin",
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

### Achievement Unlocked Event
```json
{
  "event_type": "achievement.unlocked",
  "timestamp": "2025-12-07T13:00:00Z",
  "data": {
    "user_address": "QUBICABC123...",
    "badge_id": "whale",
    "badge_name": "Whale Master",
    "badge_emoji": "🐋",
    "rarity": "legendary",
    "description": "Own 10%+ of any token supply",
    "rank": 5,
    "total_volume": 1000000000,
    "trade_count": 250
  }
}
```

---

## 🔐 Webhook Security

### HMAC Signature Verification

All webhooks are signed with HMAC-SHA256. Verify signatures in your Make.com scenario:

**Make.com Router Module:**
```javascript
// In Make.com JavaScript module
const crypto = require('crypto');

const secret = 'your-secret-key';
const payload = JSON.stringify(input.data);
const signature = input.metadata.signature.replace('sha256:', '');

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

return input.data;
```

### IP Whitelisting (Optional)

Add firewall rules to only accept webhooks from Make.com IPs:
- `54.88.50.66`
- `34.193.55.38`
- See [Make.com docs](https://www.make.com/en/help/tools/webhooks) for full list

---

## 🎨 Example Make.com Scenarios

### 1. Whale Alert → Multi-Channel Notification

**Flow:**
1. **Webhook Trigger** - Receive `whale.buy` event
2. **Filter** - Only amounts > 10M QU
3. **Discord** - Post to #whale-alerts channel
4. **Telegram** - Send to community group
5. **Twitter** - Post tweet (if > 50M QU)
6. **Google Sheets** - Log transaction

**Import:** `examples/make-templates/whale-alert-discord.json`

---

### 2. Auto-Airdrop on Holder Milestones

**Flow:**
1. **Webhook Trigger** - Receive `holder.surge` event
2. **Router** - Branch by milestone (100, 500, 1000)
3. **Branch A (100 holders):**
   - Telegram announcement
   - Google Sheets log
   - 1,000 tokens per holder
4. **Branch B (500 holders):**
   - Discord announcement with @everyone
   - Airtable record
   - 5,000 tokens + NFT badge
5. **Branch C (1000 holders):**
   - Twitter celebration post
   - Email campaign trigger
   - 10,000 tokens + special role

**Import:** `examples/make-templates/auto-airdrop-holders.json`

---

### 3. Gamification System with Rewards

**Flow:**
1. **Webhook Trigger** - Receive `achievement.unlocked`
2. **Router by Rarity:**
   - **Legendary** → Discord @everyone + Twitter post
   - **Epic** → Discord announcement + Telegram
   - **Rare** → Discord message
   - **Common** → Silent log
3. **Top 10 Filter** - If rank ≤ 10, send special message
4. **Google Sheets** - Log all achievements
5. **Discord Role Assignment** - Add role based on badge

**Import:** `examples/make-templates/gamification-discord.json`

---

## 📈 Advanced Integrations

### Real-Time Dashboard (Google Sheets)

Create a live dashboard that updates every minute:

**Make.com Scenario:**
1. **Schedule** - Run every 1 minute
2. **HTTP Request** - GET `/api/v1/leaderboard?period=24h`
3. **Google Sheets** - Update range A1:G50 with data
4. **Format** - Apply conditional formatting (top 3 green)

**Result:** Live leaderboard in Google Sheets that anyone can view!

---

### Zapier Integration

While Make.com is recommended, Zapier works too:

**Zap Flow:**
1. **Webhooks by Zapier** - Catch Hook
2. **Filter** - Only whale.buy events
3. **Slack** - Send Channel Message
4. **Email** - Send via Gmail
5. **Airtable** - Create Record

---

### n8n Self-Hosted

For advanced users who want full control:

**n8n Workflow:**
```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook",
      "webhookId": "nostromo-webhook"
    },
    {
      "type": "n8n-nodes-base.discord",
      "name": "Discord",
      "operation": "sendMessage"
    }
  ]
}
```

---

## 🛠️ Troubleshooting

### Webhook Not Receiving Data

**Check webhook is active:**
```bash
curl http://localhost:3000/api/v1/webhooks/1
```

**Test webhook manually:**
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/1/test
```

**Check logs:**
```bash
# Backend logs
tail -f logs/api.log | grep webhook

# Alert Engine logs
tail -f logs/alert-engine.log
```

---

### Signature Verification Fails

**Verify secret matches:**
```bash
# Get webhook info (secret_hash visible)
curl http://localhost:3000/api/v1/webhooks/1

# Update secret if needed
curl -X PATCH http://localhost:3000/api/v1/webhooks/1 \
  -H 'Content-Type: application/json' \
  -d '{"secret": "new-secret-key"}'
```

---

### Events Not Triggering

**Check Alert Engine is running:**
```bash
curl http://localhost:3000/api/v1/health
```

**Verify alert conditions:**
```bash
# List all alerts
curl http://localhost:3000/api/v1/alerts

# Test specific alert
curl -X POST http://localhost:3000/api/v1/alerts/1/test
```

---

## 📚 Resources

- **Make.com Templates:** `/examples/make-templates/`
- **API Documentation:** `/README.md`
- **Webhook Examples:** `/examples/INTEGRATION_EXAMPLES.md`
- **Make.com Docs:** https://www.make.com/en/help
- **Zapier Webhooks:** https://zapier.com/apps/webhook/integrations
- **n8n Docs:** https://docs.n8n.io/

---

## 🎯 Next Steps

1. **Import a template** from `examples/make-templates/`
2. **Configure your connections** (Discord, Telegram, etc.)
3. **Test the integration** with `/test` endpoint
4. **Deploy to production** and monitor

Need help? Check our Discord community or open an issue on GitHub!

---

**Made with ❤️ by Nostromo Guardian Team**  
**Powered by EasyConnect & Qubic Network**
