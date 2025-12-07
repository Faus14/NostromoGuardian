import { Request, Response } from 'express';
import { pool } from '../services/database.service';
import {
  ALERT_EVENT_TYPES,
  AlertEventType,
  AlertRecord,
  evaluateAlert,
  hydrateAlertRow,
} from '../services/alert-engine.service';

const DEFAULT_ACTION = [{ type: 'webhook', event: 'alert.triggered' }];
const VALID_EVENT_TYPES = new Set<AlertEventType>(Object.values(ALERT_EVENT_TYPES));
const EVENT_TYPE_ALIASES: Record<string, AlertEventType> = {
  [ALERT_EVENT_TYPES.VOLUME_SPIKE]: ALERT_EVENT_TYPES.VOLUME_SPIKE,
  'volume_spike': ALERT_EVENT_TYPES.VOLUME_SPIKE,
  'volume-spike': ALERT_EVENT_TYPES.VOLUME_SPIKE,
  [ALERT_EVENT_TYPES.WHALE_BUY]: ALERT_EVENT_TYPES.WHALE_BUY,
  'whale_buy': ALERT_EVENT_TYPES.WHALE_BUY,
  'whale-buy': ALERT_EVENT_TYPES.WHALE_BUY,
  [ALERT_EVENT_TYPES.HOLDER_SURGE]: ALERT_EVENT_TYPES.HOLDER_SURGE,
  'holder_surge': ALERT_EVENT_TYPES.HOLDER_SURGE,
  'holder-surge': ALERT_EVENT_TYPES.HOLDER_SURGE,
};

function normalizeEventType(value: any): AlertEventType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const key = value.trim().toLowerCase();
  return EVENT_TYPE_ALIASES[key];
}

function normalizeToken(token?: string): string | undefined {
  if (!token || typeof token !== 'string') {
    return undefined;
  }
  return token.trim().toUpperCase();
}

function clamp(value: any, fallback: number, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function normalizeActions(actions: any): Array<{ type: string; event?: string }> {
  if (!Array.isArray(actions) || actions.length === 0) {
    return DEFAULT_ACTION;
  }

  return actions
    .map((action) => ({
      type: typeof action.type === 'string' ? action.type : 'webhook',
      event: typeof action.event === 'string' ? action.event : undefined,
    }))
    .filter((action) => action.type === 'webhook');
}

function normalizeConditions(eventType: AlertEventType, conditions: any): Record<string, any> {
  if (!conditions || typeof conditions !== 'object') {
    throw new Error('Conditions must be an object');
  }

  switch (eventType) {
    case ALERT_EVENT_TYPES.VOLUME_SPIKE:
      return {
        token: normalizeToken(conditions.token),
        period_minutes: clamp(conditions.period_minutes ?? 60, 60, 5, 2880),
        threshold_percent: clamp(conditions.threshold_percent ?? 150, 150, 10, 5000),
        min_volume: String(conditions.min_volume ?? '0'),
      };
    case ALERT_EVENT_TYPES.WHALE_BUY:
      return {
        token: normalizeToken(conditions.token),
        lookback_minutes: clamp(conditions.lookback_minutes ?? 60, 60, 5, 2880),
        min_value: String(conditions.min_value ?? '0'),
        whales_only: Boolean(conditions.whales_only ?? true),
        limit: clamp(conditions.limit ?? 5, 5, 1, 25),
      };
    case ALERT_EVENT_TYPES.HOLDER_SURGE:
      return {
        token: normalizeToken(conditions.token),
        lookback_minutes: clamp(conditions.lookback_minutes ?? 120, 120, 10, 2880),
        min_new_holders: clamp(conditions.min_new_holders ?? 5, 5, 1, 5000),
        sample_size: clamp(conditions.sample_size ?? 5, 5, 1, 50),
      };
    default:
      throw new Error(`Unsupported event type: ${eventType}`);
  }
}

function mapAlert(row: any): AlertRecord {
  return hydrateAlertRow(row);
}

export async function createAlert(req: Request, res: Response) {
  try {
    const { name, description, event_type, conditions, actions, active = true } = req.body;

    if (!name || !event_type || !conditions) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'event_type', 'conditions'],
      });
    }

    const normalizedEventType = normalizeEventType(event_type);

    if (!normalizedEventType) {
      return res.status(400).json({
        error: 'Invalid event_type',
        allowed: Array.from(VALID_EVENT_TYPES),
      });
    }

    const normalizedConditions = normalizeConditions(normalizedEventType, conditions);
    const normalizedActions = normalizeActions(actions);

    const result = await pool.query(
      `INSERT INTO alerts (name, description, event_type, conditions, actions, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        description || null,
        normalizedEventType,
        JSON.stringify(normalizedConditions),
        JSON.stringify(normalizedActions),
        active,
      ]
    );

    return res.json({
      success: true,
      alert: mapAlert(result.rows[0]),
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return res.status(500).json({
      error: 'Failed to create alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function listAlerts(req: Request, res: Response) {
  try {
    const { active } = req.query;
    const filters: string[] = [];
    const params: any[] = [];

    if (active !== undefined) {
      filters.push('active = $1');
      params.push(active === 'true');
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM alerts ${whereClause} ORDER BY created_at DESC`,
      params
    );

    return res.json({
      success: true,
      count: result.rows.length,
      alerts: result.rows.map(mapAlert),
    });
  } catch (error) {
    console.error('Error listing alerts:', error);
    return res.status(500).json({ error: 'Failed to list alerts' });
  }
}

export async function getAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json({ success: true, alert: mapAlert(result.rows[0]) });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return res.status(500).json({ error: 'Failed to fetch alert' });
  }
}

export async function updateAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, event_type, conditions, actions, active } = req.body;

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      params.push(name);
    }

    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      params.push(description);
    }

    if (event_type !== undefined) {
      const normalizedEventType = normalizeEventType(event_type);
      if (!normalizedEventType) {
        return res.status(400).json({ error: 'Invalid event_type' });
      }
      fields.push(`event_type = $${idx++}`);
      params.push(normalizedEventType);
      if (conditions) {
        fields.push(`conditions = $${idx++}`);
        params.push(JSON.stringify(normalizeConditions(normalizedEventType, conditions)));
      }
    } else if (conditions) {
      const current = await pool.query('SELECT event_type FROM alerts WHERE id = $1', [id]);
      if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      const type = current.rows[0].event_type as AlertEventType;
      fields.push(`conditions = $${idx++}`);
      params.push(JSON.stringify(normalizeConditions(type, conditions)));
    }

    if (actions !== undefined) {
      fields.push(`actions = $${idx++}`);
      params.push(JSON.stringify(normalizeActions(actions)));
    }

    if (active !== undefined) {
      fields.push(`active = $${idx++}`);
      params.push(Boolean(active));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE alerts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json({ success: true, alert: mapAlert(result.rows[0]) });
  } catch (error) {
    console.error('Error updating alert:', error);
    return res.status(500).json({ error: 'Failed to update alert' });
  }
}

export async function deleteAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json({ success: true, message: 'Alert deleted', id });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({ error: 'Failed to delete alert' });
  }
}

export async function testAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const evaluation = await evaluateAlert(result.rows[0], { dryRun: true });

    return res.json({
      success: true,
      alert_id: id,
      triggered: evaluation.triggered,
      payload: evaluation.payload,
      reason: evaluation.reason,
      evaluated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing alert:', error);
    return res.status(500).json({ error: 'Failed to test alert' });
  }
}
