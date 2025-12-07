import { Request, Response } from 'express';
import { pool } from '../services/database.service';
import crypto from 'crypto';

// ============================================================================
// WEBHOOK MANAGEMENT ENDPOINTS
// ============================================================================
// Professional webhook system for EasyConnect integrations
// Supports Make.com, Zapier, n8n push notifications

interface WebhookSubscription {
  id?: number;
  url: string;
  events: string[];
  secret?: string;
  description?: string;
  active: boolean;
  created_at?: Date;
}

// Available webhook events
export const WEBHOOK_EVENTS = {
  WHALE_BUY: 'whale.buy',
  WHALE_SELL: 'whale.sell',
  NEW_HOLDER: 'holder.new',
  VOLUME_SPIKE: 'volume.spike',
  PRICE_CHANGE: 'price.change',
  DIAMOND_HAND: 'achievement.diamond_hand',
  LEADERBOARD_UPDATE: 'leaderboard.update'
} as const;

/**
 * Register a new webhook subscription
 * POST /api/v1/webhooks/register
 * 
 * Body:
 * {
 *   "url": "https://hooks.make.com/xxxxx",
 *   "events": ["whale.buy", "whale.sell"],
 *   "description": "Discord whale alerts",
 *   "secret": "optional_signing_secret"
 * }
 */
export async function registerWebhook(req: Request, res: Response) {
  try {
    const { url, events, description, secret } = req.body;

    // Validation
    if (!url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: {
          url: 'string (webhook URL)',
          events: 'array (event types to subscribe)'
        }
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format',
        example: 'https://hooks.make.com/xxxxxxxxx'
      });
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = events.filter(e => !validEvents.includes(e));
    
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: 'Invalid event types',
        invalid: invalidEvents,
        valid_events: validEvents
      });
    }

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Insert into database
    const result = await pool.query(
      `INSERT INTO webhooks (url, events, description, secret, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, url, events, description, active, created_at`,
      [url, JSON.stringify(events), description || null, webhookSecret]
    );

    const webhook = result.rows[0];

    res.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: typeof webhook.events === 'string' ? JSON.parse(webhook.events) : webhook.events,
        description: webhook.description,
        secret: webhookSecret, // Return secret only on creation
        active: webhook.active,
        created_at: webhook.created_at
      },
      message: 'Webhook registered successfully. Save the secret for signature verification.'
    });

  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ 
      error: 'Failed to register webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * List all registered webhooks
 * GET /api/v1/webhooks/list
 */
export async function listWebhooks(req: Request, res: Response) {
  try {
    const { active } = req.query;

    let query = 'SELECT id, url, events, description, active, created_at, last_triggered FROM webhooks';
    const params: any[] = [];

    if (active !== undefined) {
      query += ' WHERE active = $1';
      params.push(active === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const webhooks = result.rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
      description: row.description,
      active: row.active,
      created_at: row.created_at,
      last_triggered: row.last_triggered
      // Note: secret is NOT returned for security
    }));

    res.json({
      success: true,
      count: webhooks.length,
      webhooks
    });

  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ 
      error: 'Failed to list webhooks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Unregister a webhook
 * DELETE /api/v1/webhooks/:id
 */
export async function unregisterWebhook(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM webhooks WHERE id = $1 RETURNING id, url',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Webhook not found',
        id
      });
    }

    res.json({
      success: true,
      message: 'Webhook unregistered successfully',
      webhook: result.rows[0]
    });

  } catch (error) {
    console.error('Error unregistering webhook:', error);
    res.status(500).json({ 
      error: 'Failed to unregister webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update webhook status (enable/disable)
 * PATCH /api/v1/webhooks/:id
 */
export async function updateWebhook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { active, events, description } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      params.push(active);
    }

    if (events !== undefined && Array.isArray(events)) {
      // Validate events
      const validEvents = Object.values(WEBHOOK_EVENTS);
      const invalidEvents = events.filter(e => !validEvents.includes(e));
      
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          error: 'Invalid event types',
          invalid: invalidEvents,
          valid_events: validEvents
        });
      }

      updates.push(`events = $${paramCount++}`);
      params.push(JSON.stringify(events));
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        allowed: ['active', 'events', 'description']
      });
    }

    params.push(id);
    const query = `
      UPDATE webhooks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, url, events, description, active, created_at
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Webhook not found',
        id
      });
    }

    const webhook = result.rows[0];

    res.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: typeof webhook.events === 'string' ? JSON.parse(webhook.events) : webhook.events,
        description: webhook.description,
        active: webhook.active,
        created_at: webhook.created_at
      }
    });

  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ 
      error: 'Failed to update webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test webhook delivery
 * POST /api/v1/webhooks/:id/test
 */
export async function testWebhook(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get webhook details
    const result = await pool.query(
      'SELECT url, events, secret FROM webhooks WHERE id = $1 AND active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Webhook not found or inactive',
        id
      });
    }

    const webhook = result.rows[0];

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery from Nostromo Guardian',
        webhook_id: id,
        subscribed_events: typeof webhook.events === 'string' ? JSON.parse(webhook.events) : webhook.events
      }
    };

    // Send test webhook
    const deliveryResult = await deliverWebhook(webhook.url, testPayload, webhook.secret);

    res.json({
      success: deliveryResult.success,
      webhook_id: id,
      url: webhook.url,
      status: deliveryResult.status,
      message: deliveryResult.success 
        ? 'Test webhook delivered successfully' 
        : 'Test webhook delivery failed',
      details: deliveryResult
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ 
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// WEBHOOK DELIVERY SERVICE
// ============================================================================

interface WebhookDeliveryResult {
  success: boolean;
  status?: number;
  error?: string;
  timestamp: string;
}

/**
 * Deliver webhook with signature
 */
export async function deliverWebhook(
  url: string, 
  payload: any, 
  secret?: string
): Promise<WebhookDeliveryResult> {
  try {
    const body = JSON.stringify(payload);
    
    // Generate signature if secret provided
    let signature = '';
    if (secret) {
      signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Nostromo-Guardian-Webhooks/1.0'
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    return {
      success: response.ok,
      status: response.status,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(eventType: string, data: any) {
  try {
    // Get all active webhooks subscribed to this event
    const result = await pool.query(
      `SELECT id, url, events, secret 
       FROM webhooks 
       WHERE active = true 
       AND events::jsonb @> $1::jsonb`,
      [JSON.stringify([eventType])]
    );

    if (result.rows.length === 0) {
      return; // No webhooks to trigger
    }

    console.log(`📢 Triggering ${result.rows.length} webhooks for event: ${eventType}`);

    // Deliver to all webhooks in parallel
    const deliveryPromises = result.rows.map(async (webhook: any) => {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      };

      const deliveryResult = await deliverWebhook(webhook.url, payload, webhook.secret);

      // Update last_triggered timestamp
      await pool.query(
        'UPDATE webhooks SET last_triggered = NOW() WHERE id = $1',
        [webhook.id]
      );

      // Log delivery result
      await pool.query(
        `INSERT INTO webhook_logs (webhook_id, event, success, status_code, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          webhook.id,
          eventType,
          deliveryResult.success,
          deliveryResult.status || null,
          deliveryResult.error || null
        ]
      );

      return {
        webhook_id: webhook.id,
        url: webhook.url,
        ...deliveryResult
      };
    });

    const results = await Promise.all(deliveryPromises);
    
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;

    console.log(`✅ Webhook delivery: ${successful} succeeded, ${failed} failed`);

    return results;

  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return [];
  }
}
