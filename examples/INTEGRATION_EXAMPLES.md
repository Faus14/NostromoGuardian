# Nostromo Guardian - EasyConnect Integration Examples

## 📢 1. Discord Whale Alerts (Make.com)

### Setup Steps:

1. **Register Webhook in Nostromo Guardian**
```bash
curl -X POST "http://localhost:3000/api/v1/webhooks/register" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hook.us1.make.com/YOUR_WEBHOOK_ID",
    "events": ["whale.buy", "whale.sell"],
    "description": "Discord whale alerts"
  }'
```

2. **Create Make.com Scenario**
   - Module 1: Webhooks → Custom Webhook
   - Module 2: Discord → Create Message
   - Connect them

3. **Discord Webhook URL**
   - Go to Discord Server Settings → Integrations → Webhooks
   - Create webhook, copy URL
   - Paste in Make.com Discord module

4. **Message Template**
```
🐋 **Whale Alert!**

**Event:** {{event}}
**Token:** {{data.token}}
**Trader:** {{substring(data.trader, 0, 12)}}...
**Amount:** {{formatNumber(data.amount, 0)}}
**Value:** {{formatNumber(data.total_value, 0)}} QUBIC
**Tick:** {{data.tick}}

[View Transaction](https://explorer.qubic.org/network/tick/{{data.tick}})
```

---

## 🏆 2. Telegram Leaderboard Bot (n8n)

### Workflow:

```
[Cron Trigger] 
  → Every day at 9:00 AM
    ↓
[HTTP Request]
  → GET http://your-api.com/api/v1/leaderboard/traders?period=24h&limit=10
    ↓
[Function] 
  → Format message with emojis
    ↓
[Telegram]
  → Send message to @YourChannel
```

### n8n HTTP Request Node:
```json
{
  "method": "GET",
  "url": "http://your-api.com/api/v1/leaderboard/traders",
  "queryParameters": {
    "period": "24h",
    "limit": "10"
  }
}
```

### n8n Function Node:
```javascript
let message = "🏆 **Daily Leaderboard** 🏆\n\n";

for (const [index, trader] of items[0].json.data.entries()) {
  const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐';
  const whale = trader.portfolio.is_whale ? '🐋' : '';
  
  message += `${badge} #${trader.rank} ${whale}\n`;
  message += `└ Volume: ${(trader.stats.total_volume / 1e9).toFixed(2)}B QUBIC\n`;
  message += `└ Trades: ${trader.stats.trade_count}\n\n`;
}

return [{json: {message}}];
```

---

## 📊 3. Google Sheets Auto-Update (Zapier)

### Zap Configuration:

**Trigger**: Schedule by Zapier
- Frequency: Every 1 hour

**Action 1**: Webhooks by Zapier
- Method: GET
- URL: `http://your-api.com/api/v1/exports/holders?token=QMINE&format=json`

**Action 2**: Google Sheets - Clear Spreadsheet
- Spreadsheet: "QMINE Holders"
- Worksheet: "Live Data"

**Action 3**: Google Sheets - Create Multiple Rows
- Spreadsheet: "QMINE Holders"
- Worksheet: "Live Data"
- Map fields:
  - Column A: `{{data[].address}}`
  - Column B: `{{data[].balance}}`
  - Column C: `{{data[].percentage}}`
  - Column D: `{{data[].is_whale}}`
  - Column E: `{{data[].trades.buy_count}}`
  - Column F: `{{data[].trades.sell_count}}`

### Google Sheets Formula Examples:
```excel
// Whale count
=COUNTIF(D:D, TRUE)

// Total supply held by whales
=SUMIF(D:D, TRUE, B:B)

// Diamond hands (buy_count > 0, sell_count = 0)
=COUNTIFS(E:E, ">0", F:F, "=0")
```

---

## 🎁 4. Weekly Airdrop Automation (Zapier)

### Zap Configuration:

**Trigger**: Schedule by Zapier
- Frequency: Every Monday at 10:00 AM

**Action 1**: Webhooks by Zapier - GET Request
- URL: `http://your-api.com/api/v1/airdrops/diamond-hands?token=QMINE`

**Action 2**: Filter by Zapier
- Only continue if: `days_holding` > 30

**Action 3**: Webhooks by Zapier - GET CSV Export
- URL: `http://your-api.com/api/v1/exports/holders?token=QMINE&format=csv&min_balance=1000000000`

**Action 4**: Google Sheets - Create Spreadsheet from Text
- File name: `Airdrop_QMINE_{{current_date}}`
- Content: `{{Action 3 output}}`

**Action 5**: Email by Zapier
- To: team@yourproject.com
- Subject: "Weekly QMINE Airdrop List Ready"
- Body: 
```
{{count}} eligible addresses for this week's airdrop.

Requirements:
- Diamond hands (never sold)
- Holding > 30 days
- Balance > 1B QMINE

Download: {{Google Sheets URL}}
```

---

## 🐦 5. Twitter Milestone Bot (Make.com)

### Scenario:

**Module 1**: Webhooks - Custom Webhook
- Listening for: `achievement.diamond_hand`

**Module 2**: Router
- Route 1: days_holding = 30
- Route 2: days_holding = 60
- Route 3: days_holding = 90

**Module 3a**: Twitter - Create Tweet (30 days)
```
🎉 New Diamond Hands!

{{substring(data.address, 0, 8)}}... just reached 30 days holding $QMINE without selling! 💎🙌

Total holdings: {{formatNumber(data.balance, 0)}} QMINE

#Qubic #DiamondHands
```

**Module 3b**: Twitter - Create Tweet (60 days)
```
💎💎 Double Diamond!

{{substring(data.address, 0, 8)}}... has been holding $QMINE for 60 DAYS! 🔥

This is the way! 🚀

Total holdings: {{formatNumber(data.balance, 0)}} QMINE

#Qubic #HODL
```

**Module 3c**: Twitter - Create Tweet (90 days)
```
👑 LEGENDARY DIAMOND HANDS 👑

{{substring(data.address, 0, 8)}}... has held $QMINE for 90 DAYS! 💎💎💎

True believer! 🙏

Total holdings: {{formatNumber(data.balance, 0)}} QMINE
Percentage: {{data.percentage}}% of supply

#Qubic #Legend
```

---

## 📈 6. Slack Volume Spike Alerts (n8n)

### Workflow:

```
[Webhook Trigger]
  → Listen for volume.spike event
    ↓
[Function]
  → Calculate percentage change
    ↓
[Slack]
  → Post to #market-alerts channel
```

### n8n Webhook Trigger:
```json
{
  "httpMethod": "POST",
  "path": "/nostromo-volume-alerts",
  "responseMode": "onReceived"
}
```

### n8n Function Node:
```javascript
const data = items[0].json.data;

const percentChange = ((data.current_volume - data.avg_volume) / data.avg_volume * 100).toFixed(1);
const emoji = percentChange > 300 ? '🚀' : percentChange > 200 ? '📈' : '⬆️';

return [{
  json: {
    channel: "#market-alerts",
    text: `${emoji} *VOLUME SPIKE ALERT*`,
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `${emoji} VOLUME SPIKE: ${data.token}`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Change:*\n+${percentChange}%`
          },
          {
            "type": "mrkdwn",
            "text": `*Current Volume:*\n${(data.current_volume / 1e9).toFixed(2)}B QUBIC`
          },
          {
            "type": "mrkdwn",
            "text": `*Average Volume:*\n${(data.avg_volume / 1e9).toFixed(2)}B QUBIC`
          },
          {
            "type": "mrkdwn",
            "text": `*Timeframe:*\n24 hours`
          }
        ]
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "View Analytics"
            },
            "url": `http://your-app.com/token?name=${data.token}`
          }
        ]
      }
    ]
  }
}];
```

---

## 🔐 Webhook Security

### Verify HMAC Signature (Node.js):

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return signature === expectedSignature;
}

// Usage in your Make.com/n8n webhook:
const isValid = verifyWebhookSignature(
  webhookPayload,
  headers['x-webhook-signature'],
  'YOUR_SECRET_FROM_REGISTRATION'
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

---

## 📞 Support

Need help setting up integrations?
- 📧 Email: your-email@example.com
- 💬 Discord: Your Discord Server
- 📚 Docs: https://your-docs-url.com

---

## 🎯 Quick Start Checklist

- [ ] Register webhook in Nostromo Guardian
- [ ] Copy webhook URL from Make/Zapier/n8n
- [ ] Select events to subscribe
- [ ] Save the secret key
- [ ] Test webhook delivery
- [ ] Configure automation platform
- [ ] Test end-to-end flow
- [ ] Set up error notifications
- [ ] Monitor webhook logs

**Ready to automate your Qubic community! 🚀**
