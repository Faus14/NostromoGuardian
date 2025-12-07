# 🛡️ Nostromo Guardian - Qubic Token Analytics & EasyConnect Automation

[![Qubic Hackathon](https://img.shields.io/badge/Qubic-Hackathon%202025-00d4ff?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)
[![EasyConnect Integration](https://img.shields.io/badge/EasyConnect-FULL%20INTEGRATION-yellow?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)
[![Real Blockchain Data](https://img.shields.io/badge/Data-REAL%20BLOCKCHAIN-success?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)
[![Make.com Templates](https://img.shields.io/badge/Make.com-3%20Templates-blueviolet?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)
[![AI Powered](https://img.shields.io/badge/AI-GPT--4%20Powered-orange?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-00ff00?style=for-the-badge)](https://lablab.ai/event/qubic-hack-the-future/nostromo-guardian-by-roxiumlabs/nosotromo-guardian)

> **Bridge Qubic blockchain to no-code automation platforms. Build Discord bots, auto-airdrops, and gamification systems in minutes - no programming required!**
> 
> **NOW WITH AI:** GPT-4 powered trading insights, auto-generated announcements, and intelligent market analysis!

## What is Nostromo Guardian?
Nostromo Guardian is a production-ready analytics and automation platform for the Qubic blockchain. It indexes real trades and holders from QX, calculates risk and growth metrics, and provides smart alerts, webhooks, and gamification features for communities and projects. EasyConnect integration enables seamless automation with Make.com, Zapier, n8n, Discord, Telegram, Twitter, and more.

## Key Features
- Real blockchain data: 1,000+ trades, 15+ tokens, 28 whales detected
- Risk, growth, badges, and titles for traders
- Smart alert engine: volume spike, whale buy, holder surge
- Webhooks for automation and notifications
- Data export in CSV/JSON for Google Sheets, Excel, Airtable
- Modern frontend: dashboards, leaderboards, alerts, AI playground
- Optional AI: trade analysis, announcement generation, trader profiling

## How It Works
```
QX Smart Contract → EasyConnect → Nostromo DB
                                 ↓
                           Alert Engine
                                 ↓
                              Webhooks
                                 ↓
              Make.com / Zapier / n8n / Discord / Telegram / Twitter
```

## Setup & Usage

### Quick Start
```bash
npm install && cd frontend && npm install && cd ..
docker-compose up -d
docker exec -i qubic-db psql -U qubic -d qubic_analytics < src/database/schema.sql
npm run query-seed
npm run calculate-holders
npm run api  # Backend (port 3000)
cd frontend && npm run dev  # Frontend (port 5173)
```

### Environment Variables
- Backend: `DATABASE_URL`, `API_PORT`, `CORS_ORIGIN`, `QUBIC_RPC_MAINNET`, `OPENAI_API_KEY` (optional)
- Frontend: `VITE_API_URL`

### Main Pages
- Dashboard
- Token Analyzer
- Address Lookup
- Leaderboard
- Webhooks
- Alerts
- AI Analytics
- Integrations Guide

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 (Docker)
- **Blockchain**: Qubic Mainnet + QX

## License
MIT

---

<div align="center">

**🛡️ Nostromo Guardian - Protecting Your Qubic Investments**

*Built with ❤️ for Qubic Hackathon 2025*

</div>
