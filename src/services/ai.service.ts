import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TradeAnalysisRequest {
  trade: {
    amount: number;
    token_name: string;
    source_address: string;
    dest_address: string;
    price_estimate?: number;
  };
  context: {
    token_volume_24h: number;
    token_holders: number;
    trader_rank?: number;
    trader_trade_count?: number;
  };
}

interface AIInsights {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  risk_level: 'low' | 'medium' | 'high';
  insights: string[];
  recommendation: string;
  confidence: number;
}

interface AnnouncementRequest {
  event_type: 'whale.buy' | 'whale.sell' | 'volume.spike' | 'holder.surge' | 'achievement.unlocked';
  data: any;
}

interface GeneratedAnnouncement {
  discord_message: string;
  telegram_message: string;
  twitter_post?: string;
}

/**
 * Analyze trade with AI insights
 */
export async function analyzeTradeWithAI(request: TradeAnalysisRequest): Promise<AIInsights> {
  try {
    const prompt = `
You are a crypto trading analyst expert. Analyze this Qubic token trade:

Trade Details:
- Token: ${request.trade.token_name}
- Amount: ${request.trade.amount.toLocaleString()} QU
- Estimated Price: $${request.trade.price_estimate || 'N/A'}

Market Context:
- 24h Volume: ${request.context.token_volume_24h.toLocaleString()} QU
- Total Holders: ${request.context.token_holders}
${request.context.trader_rank ? `- Trader Rank: #${request.context.trader_rank}` : ''}
${request.context.trader_trade_count ? `- Trader History: ${request.context.trader_trade_count} trades` : ''}

Provide analysis in JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "risk_level": "low|medium|high",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendation": "short recommendation text",
  "confidence": 0.0-1.0
}

Be concise, professional, and data-driven.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional cryptocurrency analyst specializing in on-chain data analysis and trading signals.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      sentiment: result.sentiment || 'neutral',
      risk_level: result.risk_level || 'medium',
      insights: result.insights || [],
      recommendation: result.recommendation || 'Monitor closely',
      confidence: result.confidence || 0.5,
    };

  } catch (error) {
    console.error('AI Trade Analysis Error:', error);
    
    // Fallback to basic analysis
    return {
      sentiment: 'neutral',
      risk_level: 'medium',
      insights: [
        `Large trade of ${request.trade.amount.toLocaleString()} QU detected`,
        'Trade represents significant market activity',
        'Monitor for follow-up movements',
      ],
      recommendation: 'Continue monitoring this token',
      confidence: 0.6,
    };
  }
}

/**
 * Generate announcement message for event
 */
export async function generateAnnouncement(request: AnnouncementRequest): Promise<GeneratedAnnouncement> {
  try {
    const eventDescriptions = {
      'whale.buy': 'Large buy transaction (whale activity)',
      'whale.sell': 'Large sell transaction (whale activity)',
      'volume.spike': 'Trading volume spike detected',
      'holder.surge': 'Holder count milestone reached',
      'achievement.unlocked': 'Community achievement unlocked',
    };

    const prompt = `
You are a crypto community manager. Generate engaging announcements for this Qubic blockchain event:

Event Type: ${eventDescriptions[request.event_type]}
Event Data: ${JSON.stringify(request.data, null, 2)}

Generate 3 messages in JSON format:
{
  "discord_message": "Engaging Discord message with emojis (max 2000 chars)",
  "telegram_message": "Clean Telegram message with emojis (max 4096 chars)",
  "twitter_post": "Concise tweet with hashtags (max 280 chars)"
}

Guidelines:
- Use relevant emojis (🐋🚀📈💎🎉🔥)
- Be enthusiastic but professional
- Include key numbers and facts
- Add call-to-action when appropriate
- Discord: can be longer, use formatting
- Telegram: clean and structured
- Twitter: short, impactful, hashtags
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert crypto community manager who creates engaging, professional content for blockchain communities.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      discord_message: result.discord_message || generateFallbackMessage(request, 'discord'),
      telegram_message: result.telegram_message || generateFallbackMessage(request, 'telegram'),
      twitter_post: result.twitter_post,
    };

  } catch (error) {
    console.error('AI Announcement Generation Error:', error);
    
    return {
      discord_message: generateFallbackMessage(request, 'discord'),
      telegram_message: generateFallbackMessage(request, 'telegram'),
    };
  }
}

/**
 * Generate fallback message if AI fails
 */
function generateFallbackMessage(request: AnnouncementRequest, platform: 'discord' | 'telegram'): string {
  const { event_type, data } = request;

  if (event_type === 'whale.buy' || event_type === 'whale.sell') {
    const action = event_type === 'whale.buy' ? 'bought' : 'sold';
    return `🐋 **WHALE ALERT!**\n\nA whale just ${action} ${data.amount?.toLocaleString()} ${data.token_name || 'QU'}!\n\n📊 Tick: ${data.tick || 'N/A'}\n🔗 Address: ${data.source_address?.substring(0, 15)}...`;
  }

  if (event_type === 'volume.spike') {
    return `📈 **VOLUME SPIKE DETECTED!**\n\n${data.token_name} volume increased by ${data.spike_percentage}%!\n\n24h Volume: ${data.volume_24h?.toLocaleString()} QU`;
  }

  if (event_type === 'holder.surge') {
    return `🎉 **MILESTONE REACHED!**\n\n${data.token_name} just hit ${data.holder_count} holders!\n\nGrowth: +${data.growth_percentage}% in 24h`;
  }

  if (event_type === 'achievement.unlocked') {
    return `🏆 **ACHIEVEMENT UNLOCKED!**\n\n${data.badge_emoji} **${data.badge_name}**\n\n${data.description}`;
  }

  return 'Event notification';
}

/**
 * Enhance webhook payload with AI insights
 */
export async function enhanceWebhookWithAI(eventType: string, payload: any): Promise<any> {
  // Only enhance whale trades and volume spikes
  if (eventType !== 'whale.buy' && eventType !== 'whale.sell' && eventType !== 'volume.spike') {
    return payload;
  }

  try {
    // Generate AI announcement
    const announcement = await generateAnnouncement({
      event_type: eventType as any,
      data: payload.data,
    });

    // Add AI-generated messages to payload
    payload.ai_generated = {
      discord_message: announcement.discord_message,
      telegram_message: announcement.telegram_message,
      twitter_post: announcement.twitter_post,
      generated_at: new Date().toISOString(),
    };

    // If it's a trade, add AI insights
    if ((eventType === 'whale.buy' || eventType === 'whale.sell') && payload.data.amount) {
      const insights = await analyzeTradeWithAI({
        trade: {
          amount: payload.data.amount,
          token_name: payload.data.token_name || 'Unknown',
          source_address: payload.data.source_address || '',
          dest_address: payload.data.dest_address || '',
          price_estimate: payload.data.usd_value_estimate,
        },
        context: {
          token_volume_24h: payload.data.volume_24h || 0,
          token_holders: payload.data.holder_count || 0,
          trader_rank: payload.data.trader_rank,
          trader_trade_count: payload.data.trade_count,
        },
      });

      payload.ai_insights = {
        sentiment: insights.sentiment,
        risk_level: insights.risk_level,
        insights: insights.insights,
        recommendation: insights.recommendation,
        confidence: insights.confidence,
        analyzed_at: new Date().toISOString(),
      };
    }

    return payload;

  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return payload; // Return original payload if AI fails
  }
}
