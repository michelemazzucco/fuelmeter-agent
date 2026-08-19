import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { MastraStorageExporter, Observability } from '@mastra/observability';

import { fuelAgent } from './agents/fuel-agent';
import {
  forecastRunout,
  getTankStatus,
  listReadings,
  logReading,
} from './tools/fuel-tools';

export const mastra = new Mastra({
  agents: { fuel: fuelAgent },
  tools: { getTankStatus, listReadings, logReading, forecastRunout },
  storage: new LibSQLStore({
    id: 'agent-storage',
    url: 'file:./mastra.db',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'fuelmeter-agent',
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
});
