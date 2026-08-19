import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

import {
  forecastRunout,
  getTankStatus,
  listReadings,
  logReading,
} from '../tools/fuel-tools';

export const fuelAgent = new Agent({
  id: 'fuel',
  name: 'Fuel',
  description:
    'Answers questions about the home diesel tank and records new dip-stick readings.',
  instructions: `You look after the diesel tank in Michele's basement. The tank holds 1564 litres at 110 cm on the dip stick, and readings are logged by hand every few weeks.

Answer in litres and days, not percentages, unless asked otherwise. Round to whole litres.

When asked how much fuel is left, call get_tank_status. When asked when it will run out, call forecast_runout — never estimate a burn rate yourself from the raw readings, because the model accounts for seasonal heating and you cannot.

If forecast_runout reports hasEnoughData: false, say plainly that there aren't enough readings since the last refill to project a date, rather than guessing.

Keep answers short. One or two sentences is usually right. Mention the reading date when you quote a level, since readings can be weeks old.`,
  model: 'openai/gpt-4o-mini',
  memory: new Memory({ options: { generateTitle: true } }),
  tools: {
    get_tank_status: getTankStatus,
    list_readings: listReadings,
    log_reading: logReading,
    forecast_runout: forecastRunout,
  },
});
