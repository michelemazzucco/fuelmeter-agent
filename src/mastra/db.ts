import { createClient } from '@libsql/client';

import type { Reading, TankConfig } from '../fuelmeter-lib/types';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function getConfig(): Promise<TankConfig> {
  const { rows } = await db.execute(
    'select * from tank_config order by updated_at desc limit 1',
  );
  return rows[0] as unknown as TankConfig;
}

export async function getReadings(limit?: number): Promise<Reading[]> {
  const { rows } = await db.execute(
    limit
      ? { sql: 'select * from readings order by recorded_at desc limit ?', args: [limit] }
      : 'select * from readings order by recorded_at desc',
  );
  return rows.map((r) => ({ ...r, is_refill: Boolean(r.is_refill) })) as unknown as Reading[];
}
