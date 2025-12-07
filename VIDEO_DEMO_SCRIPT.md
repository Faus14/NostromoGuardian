# 🎬 Nostromo Guardian - Video Demo Script

## 📹 Video Demo (3-5 minutos)

### Opening (0:00-0:30)
**Visual:** Nostromo Guardian dashboard con datos reales

**Narración:**
> "Hi! I'm showing you Nostromo Guardian - the most complete EasyConnect integration for Qubic Hackathon 2025.
>
> While other projects simulate data or just mention EasyConnect, we built a REAL production system with 1,002 actual blockchain trades, intelligent alerts, and ready-to-use Make.com templates."

---

### Part 1: Real Data (0:30-1:00)
**Visual:** Dashboard mostrando:
- 1,002 trades
- 266 holders
- 15 tokens
- Leaderboards en vivo

**Narración:**
> "Every number you see is REAL. We indexed over 1,000 trades from Qubic mainnet QX exchange.
>
> This isn't a demo - it's a working analytics platform with whale detection, holder tracking, and gamification."

---

### Part 2: EasyConnect Integration Architecture (1:00-1:45)
**Visual:** Diagrama animado

```
QX Smart Contract
       ↓
   EasyConnect (monitors raw events)
       ↓
   Nostromo DB (processes patterns)
       ↓
   Alert Engine (intelligent triggers)
       ↓
   Webhooks (HMAC secured)
       ↓
Make.com / Zapier / Your App
```

**Narración:**
> "Here's how it works: EasyConnect monitors QX transactions. We take that raw data, index it, and add intelligence.
>
> When we detect a whale trade over 10 million QU, or volume spikes 50%, or holders surge... we trigger webhooks to Make, Zapier, or any platform you want."

---

### Part 3: Live Demo - Whale Alert (1:45-3:00)
**Visual:** Split screen:
- Left: Make.com scenario
- Right: Terminal con curl command

**Steps:**
1. Show Make.com scenario with webhook module
2. Register webhook in Nostromo:
   ```bash
   curl -X POST http://localhost:3000/api/v1/webhooks \
     -H 'Content-Type: application/json' \
     -d '{
       "url": "https://hook.us1.make.com/abc123",
       "events": ["whale.buy"]
     }'
   ```
3. Test webhook:
   ```bash
   curl -X POST http://localhost:3000/api/v1/webhooks/1/test
   ```
4. Show notification appearing in Discord/Telegram

**Narración:**
> "Let me show you how fast this is. I'm creating a webhook that sends whale alerts to Discord.
>
> I register the webhook... test it... and BOOM! Instant notification in Discord with all the trade details.
>
> This works for Discord, Telegram, Google Sheets, Email, SMS - anything Make.com supports."

---

### Part 4: Make.com Templates (3:00-3:45)
**Visual:** Show 3 template files + import process

**Narración:**
> "We provide 3 ready-to-use Make.com blueprints:
>
> 1. **Whale Alert Bot** - Multi-channel notifications for large trades
> 2. **Auto-Airdrop System** - Reward holders at milestones
> 3. **Gamification Engine** - Achievement announcements and role assignments
>
> Just import, configure your Discord/Telegram, and you're live in 5 minutes."

---

### Part 5: API Power (3:45-4:15)
**Visual:** Quick montage of API calls returning data

**Narración:**
> "Beyond webhooks, we have 22 production-ready API endpoints:
>
> - Real-time leaderboards
> - Holder exports to CSV/JSON  
> - Risk scoring
> - Diamond hands detection
> - Custom alert rules
>
> Everything you need to build analytics tools, trading bots, or community dashboards."

---

### Part 6: Why We Win (4:15-4:45)
**Visual:** Comparison table

| Feature | Nostromo | Others |
|---------|----------|--------|
| Real Data | ✅ 1,002+ trades | ❌ Mock |
| EasyConnect | ✅ Full integration | ⚠️ Mentioned |
| Make Templates | ✅ 3 blueprints | ❌ None |
| Webhooks | ✅ HMAC + retry | ⚠️ Basic |
| API Endpoints | ✅ 22 production | ⚠️ 2-3 |

**Narración:**
> "So why should we win?
>
> We're the ONLY project with real blockchain data, complete EasyConnect integration, production-ready webhooks, AND Make.com templates you can use today.
>
> We didn't just build for the hackathon - we built for the ecosystem."

---

### Closing (4:45-5:00)
**Visual:** GitHub repo + links

**Narración:**
> "Check out the code on GitHub. Try the Make.com templates. Join our Discord.
>
> Nostromo Guardian - bridging Qubic to no-code automation.
>
> Thanks for watching!"

---

## 📋 Recording Checklist

### Before Recording:
- [ ] Backend running (`npm run api`)
- [ ] Frontend running (`npm run dev`)
- [ ] Make.com scenario prepared
- [ ] Discord webhook configured
- [ ] Test data ready
- [ ] Screen recording software ready (OBS/QuickTime)

### During Recording:
- [ ] Show live terminal commands
- [ ] Demonstrate real webhook delivery
- [ ] Display actual Discord/Telegram notifications
- [ ] Keep pace energetic but clear
- [ ] Highlight "REAL DATA" multiple times

### After Recording:
- [ ] Add captions/subtitles
- [ ] Insert comparison graphics
- [ ] Add background music (optional)
- [ ] Upload to YouTube with:
  - Title: "Nostromo Guardian - EasyConnect Integration for Qubic Hackathon 2025"
  - Tags: qubic, easyconnect, make.com, webhook, automation, hackathon
  - Description with GitHub link + docs

---

## 🎥 B-Roll Footage Ideas

1. **Leaderboard scrolling** - Show real traders moving up/down
2. **Webhook logs** - Terminal showing delivery confirmations
3. **Make.com scenario running** - Operations lighting up in sequence
4. **Discord notifications** - Messages appearing in real-time
5. **GitHub code** - Show key files (Alert Engine, Webhooks)
6. **Gamification UI** - Badge unlock animations

---

## 🔊 Audio Script (Detailed)

### Introduction
"Hey everyone! Today I'm excited to show you Nostromo Guardian - our submission for the Qubic Hackathon 2025, Track 2: EasyConnect Integrations.

What makes us different? While most projects simulate blockchain data or just mention EasyConnect in their docs, we built a complete production system with over 1,000 REAL blockchain trades, intelligent pattern detection, and ready-to-use automation templates."

### Real Data Emphasis
"Look at this dashboard. Every single number you're seeing is pulled from actual Qubic mainnet transactions. 

We've indexed 1,002 trades from the QX exchange. We're tracking 266 real holders. We've identified 28 whales with more than 10% supply concentration.

This isn't a hackathon demo with fake data - this is a working analytics platform you could deploy today."

### EasyConnect Explanation
"Now let me explain how we integrate with EasyConnect.

EasyConnect is awesome - it monitors Qubic smart contracts and captures raw blockchain events. But what if you want MORE than just raw data?

That's where we come in. We sit on top of EasyConnect's data stream, process it through our analytics engine, detect patterns like whale movements and volume spikes, then trigger intelligent alerts through webhooks.

Think of it as a two-layer system: EasyConnect captures events, Nostromo Guardian adds intelligence."

### Live Demo
"Let me show you how fast this works.

I'm going to create a whale alert that sends notifications to Discord whenever someone trades more than 10 million QU.

First, I register the webhook... *typing* ...there.

Now let me test it... *click* 

And BOOM! Look at Discord - instant notification with all the trade details, the addresses involved, even an estimated USD value.

This same webhook can trigger anything in Make.com - Google Sheets updates, Telegram messages, email alerts, SMS via Twilio, Twitter posts - whatever you need."

### Templates Showcase
"But here's the best part - you don't have to build this from scratch.

We're providing 3 complete Make.com blueprints that you can import right now:

The Whale Alert Bot handles multi-channel notifications with smart filtering by trade size.

The Auto-Airdrop System detects holder milestones and calculates reward distributions automatically.

And the Gamification Engine celebrates achievements with Discord roles, Twitter posts, and leaderboard updates.

Just import the blueprint, connect your Discord or Telegram, and you're live in literally 5 minutes."

### API Power
"And beyond webhooks, we've built 22 production-ready API endpoints for everything you might need:

Real-time leaderboards with trader rankings and badges.
Holder data exports in CSV or JSON for Excel and Google Sheets.
Risk scoring that analyzes whale concentration and volume volatility.
Diamond hands detection for users who've never sold.
And a complete alert engine where you can define custom rules for any condition.

Everything is documented with OpenAPI specs and curl examples."

### Why We Win
"So here's why we think Nostromo Guardian should win this hackathon:

We're the ONLY project with real blockchain data - not simulated, not mocked - actual trades from Qubic mainnet.

We built a COMPLETE EasyConnect integration - not just a mention in the docs, but working webhooks with HMAC signatures and retry logic.

We provide ready-to-use Make.com templates that anyone can import and start using immediately.

We have 22 production-grade API endpoints with proper error handling, pagination, and security.

And we didn't just build for the hackathon - we built for the ecosystem. This is something the Qubic community can actually use."

### Closing
"You can find everything on our GitHub repo - the full source code, API documentation, Make.com templates, and setup instructions.

Try it out. Build something cool with it. And if you have questions, join our Discord.

Thanks for watching, and may the best project win!"

---

## 🎬 Production Notes

**Duration:** 4-5 minutes  
**Format:** 1080p, 60fps  
**Software:** OBS Studio or QuickTime  
**Mic:** Use good quality mic (not laptop built-in)  
**Background:** Quiet room, no distractions  
**Pace:** Energetic but clear - show excitement!  

**Key Message:** We built REAL, not DEMO. We're PRODUCTION-READY, not prototype.
