# 🎥 EasyConnect Demo Scenarios

## Real-World Use Cases with Make.com

---

## Scenario 1: 🐋 Whale Alert Bot

**Objective:** Notify your community instantly when a whale makes a move

### Flow:
```
Qubic Blockchain → Nostromo Guardian → Make.com → Discord/Telegram
```

### Step-by-Step:

**1. Setup Webhook in Nostromo:**
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/register \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://hook.us1.make.com/abc123xyz",
    "events": ["whale.buy", "whale.sell"],
    "secret": "my-super-secret-key"
  }'
```

**2. Import Make.com Template:**
- File: `examples/make-templates/whale-alert-discord.json`
- Modules: Webhook → Filter → Discord

**3. Configure Discord Webhook:**
```
Server Settings → Integrations → Webhooks → New Webhook
Copy URL: https://discord.com/api/webhooks/123456/ABC-xyz
```

**4. Test:**
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/1/test
```

**Expected Output in Discord:**
```
🐋 WHALE ALERT
━━━━━━━━━━━━━━━━
💰 Amount: 15,000,000 QU
📊 Tick: 15234567
🔗 From: QUBICABCD1234...
➡️ To: QUBICXYZ789...
🔍 View Transaction: [Explorer Link]

Nostromo Guardian • Powered by EasyConnect
```

---

## Scenario 2: 🎁 Auto-Airdrop System

**Objective:** Automatically reward token holders when milestones are reached

### Flow:
```
Holder Count Reaches 100 → Webhook → Make.com → Multi-Channel Announcement + Airtable Log
```

### Step-by-Step:

**1. Trigger Milestone Event:**
```bash
curl -X POST http://localhost:3000/api/v1/events/milestone-reached \
  -H 'Content-Type: application/json' \
  -d '{
    "token_id": "CFBMEMZOIDEXDYNOJGJLQOBODJOPAOFWIXKG",
    "token_name": "QMINE",
    "milestone": 100
  }'
```

**2. Make.com Router Logic:**
```
IF milestone == 100:
  → Send Telegram message: "🎉 100 holders! Everyone gets 1,000 tokens"
  → Log to Google Sheets
  
IF milestone == 500:
  → Send Discord @everyone: "🚀 500 holders! 5,000 tokens + NFT badge"
  → Create Airtable record
  → Tweet announcement
```

**3. Expected Results:**

**Telegram:**
```
🎉 Milestone Reached!

QMINE just hit 100 holders!

Reward: Every holder gets 1,000 bonus tokens! 🎁
```

**Google Sheets (Auto-Updated):**
| Timestamp | Token | Name | Holders | Milestone | Reward |
|-----------|-------|------|---------|-----------|--------|
| 2025-12-07 | CFBM... | QMINE | 103 | 100 Holders | 1000 tokens |

---

## Scenario 3: 🎮 Gamification System

**Objective:** Celebrate user achievements with multi-channel rewards

### Flow:
```
User Unlocks Badge → Webhook → Make.com Router → Discord/Twitter/Telegram (based on rarity)
```

### Step-by-Step:

**1. Trigger Badge Unlock:**
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

**2. Make.com Router Routes:**

**Route A: Legendary Badges**
```
→ Discord with @everyone ping
→ Twitter post
→ Telegram announcement
→ Google Sheets log
```

**Route B: Epic Badges**
```
→ Discord announcement (no ping)
→ Telegram message
→ Google Sheets log
```

**Route C: Rare/Common Badges**
```
→ Silent Discord message
→ Google Sheets log only
```

**3. Expected Output:**

**Discord (@everyone):**
```
🏆 LEGENDARY ACHIEVEMENT UNLOCKED!

QUBICABC123... just earned the legendary badge!

🐋 Badge: Whale Master
🎖️ Rarity: LEGENDARY
📊 Description: Own 10%+ of any token supply

📈 Stats:
Rank: #5
Volume: 1,000,000,000 QU
Trades: 250

Nostromo Guardian • Gamification System
```

**Twitter (Auto-Posted):**
```
🐋 New Whale Master on @Qubic_network!

QUBICABC123... just unlocked the legendary Whale Master badge 🏆

💰 Total Volume: 1,000,000,000 $QU

#Qubic #DeFi #WhaleAlert
```

---

## Scenario 4: 📊 Live Dashboard in Google Sheets

**Objective:** Real-time leaderboard that updates every minute

### Flow:
```
Make.com Schedule (1 min) → API Request → Google Sheets Update
```

### Step-by-Step:

**1. Create Google Sheet:**
- Header Row: Rank | Address | Volume | Trades | Badge | Title

**2. Make.com Scenario:**
```
Schedule: Every 1 minute
  ↓
HTTP GET: http://localhost:3000/api/v1/leaderboard/traders?period=24h
  ↓
Parse JSON
  ↓
Google Sheets: Update Range A2:G51
  ↓
Conditional Formatting: Top 3 = Green, Whales = Purple
```

**3. Result:**

**Google Sheet (Live Updating):**
| Rank | Address | Volume (QU) | Trades | Badge | Title | Is Whale |
|------|---------|-------------|--------|-------|-------|----------|
| 🥇 1 | QUBIC123... | 1,234,567,890 | 456 | 💎 | Diamond Trader | Yes |
| 🥈 2 | QUBIC456... | 987,654,321 | 234 | 🥇 | Gold Trader | No |
| 🥉 3 | QUBIC789... | 765,432,109 | 189 | 🐋 | Whale Master | Yes |

**Share Link:** Anyone with link can view live rankings!

---

## Scenario 5: 🎯 Market Intelligence Bot

**Objective:** Get notified when trading opportunities arise

### Flow:
```
Alert Engine Detects Volume Spike → Webhook → Make.com → Email + Slack + SMS
```

### Step-by-Step:

**1. Create Alert in Nostromo:**
```bash
curl -X POST http://localhost:3000/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "QMINE Volume Spike",
    "event_type": "volume.spike",
    "conditions": {
      "token_id": "CFBMEMZOIDEXDYNOJGJLQOBODJOPAOFWIXKG",
      "spike_percentage": 50
    },
    "active": true
  }'
```

**2. Make.com Parallel Notifications:**
```
Webhook Trigger
  ├─→ Gmail: Send to trading@example.com
  ├─→ Slack: Post to #trading-signals
  ├─→ Twilio SMS: Alert to phone
  └─→ Push Notification: Mobile app
```

**3. Expected Notifications:**

**Email Subject:**
```
🔔 QMINE Volume Alert: +150% in 24h
```

**Email Body:**
```
Trading Opportunity Detected

Token: QMINE
24h Volume: 500,000,000 QU
7d Average: 200,000,000 QU
Spike: +150%

Reason: Volume increased by 2.5x in 24 hours

Action: Consider reviewing trading strategy

View Analytics: http://localhost:8080/tokens/CFBM.../analytics
```

**Slack Message:**
```
🔔 *Volume Spike Alert*

*QMINE* trading volume spiked *150%* in the last 24 hours

📊 Volume: 500M QU (7d avg: 200M)
⏰ Detected: 2 minutes ago

<http://localhost:8080/analytics|View Dashboard>
```

---

## Scenario 6: 🏆 Tournament Prize Distribution

**Objective:** Automatically distribute prizes when tournament ends

### Flow:
```
API Call (Manual/Scheduled) → Top 10 Traders → Make.com → Announce Winners + Send Prizes
```

### Step-by-Step:

**1. Get Tournament Winners:**
```bash
curl http://localhost:3000/api/v1/leaderboard/traders?period=7d&limit=10
```

**2. Make.com Workflow:**
```
HTTP Request
  ↓
Parse JSON
  ↓
For Each Winner (Iterator):
  ├─→ Discord: Announce winner
  ├─→ Airtable: Record prize info
  └─→ Webhook: Trigger prize distribution
```

**3. Discord Announcements:**
```
🏆 Tournament Results - Week 49

🥇 1st Place: QUBIC123... 
   Prize: 100,000 QU + Legendary NFT
   
🥈 2nd Place: QUBIC456...
   Prize: 50,000 QU + Epic NFT
   
🥉 3rd Place: QUBIC789...
   Prize: 25,000 QU + Rare NFT
   
🎖️ 4th-10th Place: 10,000 QU each

Congratulations to all participants!
```

---

## Testing All Scenarios

### Quick Test Script:

```bash
#!/bin/bash

# Test Whale Alert
curl -X POST http://localhost:3000/api/v1/webhooks/1/test

# Test Milestone
curl -X POST http://localhost:3000/api/v1/events/milestone-reached \
  -H 'Content-Type: application/json' \
  -d '{"token_id": "TEST123", "token_name": "Test Token", "milestone": 100}'

# Test Badge Unlock
curl -X POST http://localhost:3000/api/v1/events/badge-unlock \
  -H 'Content-Type: application/json' \
  -d '{"address": "QUBICTEST", "badge_id": "test", "badge_name": "Test Badge", "badge_emoji": "🧪", "rarity": "common", "description": "Test badge"}'

# Test Alert Trigger
curl -X POST http://localhost:3000/api/v1/alerts/1/test

echo "✅ All scenarios tested!"
```

---

## Production Deployment

### Make.com Limits:
- **Free Plan:** 1,000 operations/month
- **Core Plan:** 10,000 operations/month ($9/mo)
- **Pro Plan:** 10,000+ operations/month ($16/mo)

### Recommended Setup:
1. **Whale Alerts:** 100-500 ops/day = 3,000-15,000/month
2. **Leaderboard Updates:** 1,440 ops/day (every min) = 43,200/month
3. **Achievement Notifications:** 50-200 ops/day = 1,500-6,000/month

**Total:** ~50,000 ops/month → **Pro Plan required for full automation**

---

## Support & Resources

- **Templates:** `/examples/make-templates/`
- **Integration Guide:** `/EASYCONNECT_INTEGRATION.md`
- **API Docs:** `/README.md`
- **Discord:** [Join Community](#)
- **Make.com Academy:** https://www.make.com/en/academy

---

**Made with ❤️ for Qubic Hackathon 2025**
