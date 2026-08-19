import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { computePrediction } from '../../fuelmeter-lib/predictions';
import { cmToLiters } from '../../fuelmeter-lib/tank-lookup';
import { db, getConfig, getReadings } from '../db';

export const getTankStatus = createTool({
  id: 'get_tank_status',
  description:
    'Current state of the diesel tank: the most recent reading, its level in litres, and how full the tank is relative to capacity. Use this for any "how much fuel is left" question.',
  inputSchema: z.object({}),
  execute: async () => {
    const [config, readings] = await Promise.all([getConfig(), getReadings(1)]);
    const latest = readings[0];

    if (!latest) return { config, latest: null, percentFull: null, belowThreshold: null };

    const liters = latest.level_liters;
    return {
      config,
      latest,
      percentFull: liters == null ? null : Math.round((liters / config.capacity_liters) * 1000) / 10,
      belowThreshold: liters == null ? null : liters < config.low_threshold_liters,
    };
  },
});

export const listReadings = createTool({
  id: 'list_readings',
  description:
    'Recent dip-stick readings, newest first. Each has a date, level in cm and litres, and whether it was a refill. Use this to describe history or trends.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).default(20).describe('How many readings to return.'),
  }),
  execute: async ({ limit }) => ({ readings: await getReadings(limit) }),
});

export const logReading = createTool({
  id: 'log_reading',
  description:
    'Record a new dip-stick reading. Give the level in cm and the litres are derived from the tank calibration table. Set isRefill when the tank has just been filled.',
  inputSchema: z.object({
    levelCm: z.number().min(0).max(110).describe('Dip-stick reading in centimetres.'),
    isRefill: z.boolean().default(false),
    notes: z.string().optional(),
    recordedAt: z.string().optional().describe('ISO date. Defaults to today.'),
  }),
  execute: async ({ levelCm, isRefill, notes, recordedAt }) => {
    const liters = cmToLiters(levelCm);
    const when = recordedAt ?? new Date().toISOString().slice(0, 10);

    await db.execute({
      sql: 'insert into readings (recorded_at, level_cm, level_liters, is_refill, notes) values (?, ?, ?, ?, ?)',
      args: [when, levelCm, liters, isRefill ? 1 : 0, notes ?? null],
    });

    return { recordedAt: when, levelCm, levelLiters: liters, isRefill };
  },
});

export const forecastRunout = createTool({
  id: 'forecast_runout',
  description:
    'Project when the tank will run dry, using the seasonal consumption model fitted to past readings. Returns the daily burn rate, the projected run-out date, and days remaining.',
  inputSchema: z.object({}),
  execute: async () => {
    const [config, readings] = await Promise.all([getConfig(), getReadings()]);
    const p = computePrediction(readings, config.capacity_liters);

    return {
      dailyRateLiters: p.dailyRateLiters,
      runOutDate: p.runOutDate ? p.runOutDate.toISOString().slice(0, 10) : null,
      daysRemaining: p.daysRemaining,
      hasEnoughData: p.hasEnoughData,
      isSeasonal: p.isSeasonal,
      lowThresholdLiters: config.low_threshold_liters,
    };
  },
});
