import { pool } from './database.service';
import { triggerWebhooks } from '../api/webhooks';
import { enhanceWebhookWithAI } from './ai.service';

export const ALERT_EVENT_TYPES = {
  VOLUME_SPIKE: 'volume.spike',
  WHALE_BUY: 'whale.buy',
  HOLDER_SURGE: 'holder.surge',
} as const;

export type AlertEventType = typeof ALERT_EVENT_TYPES[keyof typeof ALERT_EVENT_TYPES];

export interface AlertAction {
  type: 'webhook' | string;
  event?: string;
  metadata?: Record<string, any>;
}

export interface AlertRecord {
  id: number;
  name: string;
  description?: string | null;
  event_type: AlertEventType;
  conditions: Record<string, any>;
  actions: AlertAction[];
  active: boolean;
  created_at: Date | string;
  last_triggered: Date | string | null;
  trigger_count: number;
}

export interface AlertEvaluationResult {
  triggered: boolean;
  payload?: Record<string, any>;
  reason?: string;
}

interface EvaluateOptions {
  dryRun?: boolean;
}

const ALERT_INTERVAL_MS = 60000;
let alertInterval: NodeJS.Timeout | null = null;

export function hydrateAlertRow(row: any): AlertRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    event_type: row.event_type,
    conditions:
      typeof row.conditions === 'string'
        ? JSON.parse(row.conditions)
        : row.conditions || {},
    actions:
      typeof row.actions === 'string'
        ? JSON.parse(row.actions)
        : Array.isArray(row.actions)
          ? row.actions
          : [],
    active: row.active,
    created_at: row.created_at,
    last_triggered: row.last_triggered,
    trigger_count: row.trigger_count || 0,
  } as AlertRecord;
}

export function startAlertEngine(): void {
  if (alertInterval) {
    return;
  }

  console.log('[AlertEngine] Starting background evaluation every 60s');
  alertInterval = setInterval(() => {
    runAlertEvaluation().catch((error) => {
      console.error('[AlertEngine] Interval evaluation failed', error);
    });
  }, ALERT_INTERVAL_MS);

  // Run immediately on boot
  runAlertEvaluation().catch((error) => {
    console.error('[AlertEngine] Initial evaluation failed', error);
  });
}

export async function runAlertEvaluation(): Promise<void> {
  const { rows } = await pool.query('SELECT * FROM alerts WHERE active = true');

  if (rows.length === 0) {
    return;
  }

  console.log(`[AlertEngine] Evaluating ${rows.length} active alerts`);

  for (const row of rows) {
    try {
      await evaluateAlert(row);
    } catch (error) {
      console.error(`[AlertEngine] Error evaluating alert ${row.id}`, error);
      await triggerWebhooks('alert.failed', {
        alert_id: row.id,
        name: row.name,
        event_type: row.event_type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export async function evaluateAlert(row: any, options: EvaluateOptions = {}): Promise<AlertEvaluationResult> {
  const alert = hydrateAlertRow(row);
  let evaluation: AlertEvaluationResult = { triggered: false };

  switch (alert.event_type) {
    case ALERT_EVENT_TYPES.VOLUME_SPIKE:
      evaluation = await evaluateVolumeSpike(alert);
      break;
    case ALERT_EVENT_TYPES.WHALE_BUY:
      evaluation = await evaluateWhaleBuy(alert);
      break;
    case ALERT_EVENT_TYPES.HOLDER_SURGE:
      evaluation = await evaluateHolderSurge(alert);
      break;
    default:
      evaluation = {
        triggered: false,
        reason: `Unsupported alert type: ${alert.event_type}`,
      };
  }

  if (evaluation.triggered && !options.dryRun) {
    await pool.query(
      'UPDATE alerts SET last_triggered = NOW(), trigger_count = trigger_count + 1 WHERE id = $1',
      [alert.id]
    );

    await dispatchAlertActions(alert, evaluation.payload || {});
  }

  return evaluation;
}

async function dispatchAlertActions(alert: AlertRecord, payload: Record<string, any>): Promise<void> {
  const actions = alert.actions.length > 0 ? alert.actions : [{ type: 'webhook' }];

  for (const action of actions) {
    if (action.type === 'webhook') {
      let webhookPayload: any = {
        alert_id: alert.id,
        name: alert.name,
        event_type: alert.event_type,
        payload,
        created_at: alert.created_at,
        triggered_at: new Date().toISOString(),
      };

      // Enhance webhook with AI if OPENAI_API_KEY is set
      if (process.env.OPENAI_API_KEY) {
        try {
          webhookPayload = await enhanceWebhookWithAI(action.event || 'alert.triggered', webhookPayload);
        } catch (error) {
          console.error('AI Enhancement failed, sending original payload:', error);
        }
      }

      await triggerWebhooks(action.event || 'alert.triggered', webhookPayload);
    }
  }
}

async function evaluateVolumeSpike(alert: AlertRecord): Promise<AlertEvaluationResult> {
  const conditions = alert.conditions || {};
  const token = typeof conditions.token === 'string' ? conditions.token : undefined;
  const periodMinutes = clampNumber(conditions.period_minutes, 60, 5, 1440);
  const thresholdPercent = clampNumber(conditions.threshold_percent, 150, 10, 5000);
  const minVolume = Number(conditions.min_volume || 0);

  const tokenClauseNow = token ? 'AND token_name = $2' : '';
  const paramsNow = token ? [periodMinutes, token] : [periodMinutes];

  const nowVolumeQuery = `
    SELECT COALESCE(SUM(total_value), 0) as volume
    FROM trades
    WHERE timestamp >= NOW() - make_interval(mins => $1)
    ${tokenClauseNow}
  `;

  const nowVolumeResult = await pool.query(nowVolumeQuery, paramsNow);
  const currentVolume = Number(nowVolumeResult.rows[0]?.volume || 0);

  const prevStart = periodMinutes * 2;
  const tokenClausePrev = token ? 'AND token_name = $3' : '';
  const prevParams = token ? [prevStart, periodMinutes, token] : [prevStart, periodMinutes];

  const prevVolumeQuery = `
    SELECT COALESCE(SUM(total_value), 0) as volume
    FROM trades
    WHERE timestamp >= NOW() - make_interval(mins => $1)
      AND timestamp < NOW() - make_interval(mins => $2)
    ${tokenClausePrev}
  `;

  const prevVolumeResult = await pool.query(prevVolumeQuery, prevParams);
  const previousVolume = Number(prevVolumeResult.rows[0]?.volume || 0);

  const percentChange = previousVolume === 0
    ? (currentVolume > 0 ? 1000 : 0)
    : ((currentVolume - previousVolume) / previousVolume) * 100;

  const triggered = currentVolume >= minVolume && percentChange >= thresholdPercent;

  return {
    triggered,
    payload: {
      token,
      period_minutes: periodMinutes,
      current_volume: currentVolume,
      previous_volume: previousVolume,
      percent_change: Number(percentChange.toFixed(2)),
      threshold_percent: thresholdPercent,
      min_volume: minVolume,
    },
    reason: triggered ? undefined : 'Threshold not met',
  };
}

async function evaluateWhaleBuy(alert: AlertRecord): Promise<AlertEvaluationResult> {
  const conditions = alert.conditions || {};
  const token = typeof conditions.token === 'string' ? conditions.token : undefined;
  const lookbackMinutes = clampNumber(conditions.lookback_minutes, 60, 5, 1440);
  const minValue = Number(conditions.min_value || 0);
  const whalesOnly = Boolean(conditions.whales_only ?? true);
  const limit = clampNumber(conditions.limit, 5, 1, 20);

  const params: any[] = [lookbackMinutes, minValue, limit];
  let tokenClause = '';
  let tokenIndex = 4;

  if (token) {
    tokenClause = `AND t.token_name = $${tokenIndex}`;
    params.push(token);
    tokenIndex += 1;
  }

  const whaleClause = whalesOnly ? 'AND COALESCE(h.is_whale, false) = true' : '';

  const query = `
    SELECT 
      t.tx_id,
      t.trader,
      t.token_name,
      t.total_value,
      t.amount,
      t.timestamp,
      COALESCE(h.is_whale, false) as is_whale
    FROM trades t
    LEFT JOIN holders h ON h.address = t.trader AND h.token_name = t.token_name
    WHERE t.trade_type = 'BUY'
      AND t.timestamp >= NOW() - make_interval(mins => $1)
      AND t.total_value::NUMERIC >= $2::NUMERIC
      ${tokenClause}
      ${whaleClause}
    ORDER BY t.total_value DESC
    LIMIT $3
  `;

  const result = await pool.query(query, params);
  const trades = result.rows;

  return {
    triggered: trades.length > 0,
    payload: {
      token,
      lookback_minutes: lookbackMinutes,
      min_value: minValue,
      whales_only: whalesOnly,
      trades,
    },
    reason: trades.length > 0 ? undefined : 'No whale trades found',
  };
}

async function evaluateHolderSurge(alert: AlertRecord): Promise<AlertEvaluationResult> {
  const conditions = alert.conditions || {};
  const token = typeof conditions.token === 'string' ? conditions.token : undefined;
  const lookbackMinutes = clampNumber(conditions.lookback_minutes, 120, 10, 2880);
  const minNewHolders = clampNumber(conditions.min_new_holders, 5, 1, 5000);
  const sampleSize = clampNumber(conditions.sample_size, 5, 1, 25);

  const paramsCount: any[] = [lookbackMinutes];
  const paramsSample: any[] = [lookbackMinutes, sampleSize];
  let tokenClauseCount = '';
  let tokenClauseHistorical = '';

  if (token) {
    tokenClauseCount = 'AND token_name = $2';
    tokenClauseHistorical = 'AND token_name = $2';
    paramsCount.push(token);
    paramsSample.splice(1, 0, token);
  }

  const countQuery = `
    WITH new_traders AS (
      SELECT DISTINCT trader
      FROM trades
      WHERE timestamp >= NOW() - make_interval(mins => $1)
      ${tokenClauseCount}
    )
    SELECT COUNT(*) AS total
    FROM new_traders nt
    WHERE NOT EXISTS (
      SELECT 1 FROM trades t
      WHERE t.trader = nt.trader
        ${tokenClauseHistorical}
        AND t.timestamp < NOW() - make_interval(mins => $1)
    )
  `;

  const countResult = await pool.query(countQuery, paramsCount);
  const totalNew = Number(countResult.rows[0]?.total || 0);

  const sampleQuery = `
    WITH new_traders AS (
      SELECT DISTINCT trader
      FROM trades
      WHERE timestamp >= NOW() - make_interval(mins => $1)
      ${tokenClauseCount}
    ),
    first_time AS (
      SELECT nt.trader
      FROM new_traders nt
      WHERE NOT EXISTS (
        SELECT 1 FROM trades t
        WHERE t.trader = nt.trader
          ${tokenClauseHistorical}
          AND t.timestamp < NOW() - make_interval(mins => $1)
      )
    )
    SELECT trader
    FROM first_time
    LIMIT $${token ? 3 : 2}
  `;

  const sampleResult = await pool.query(sampleQuery, paramsSample);
  const sample = sampleResult.rows.map((row) => row.trader);

  return {
    triggered: totalNew >= minNewHolders,
    payload: {
      token,
      lookback_minutes: lookbackMinutes,
      min_new_holders: minNewHolders,
      total_new_holders: totalNew,
      sample,
    },
    reason: totalNew >= minNewHolders ? undefined : 'Not enough new holders',
  };
}

function clampNumber(value: any, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    value = parsed;
  }

  if (value < min) return min;
  if (value > max) return max;
  return value;
}
