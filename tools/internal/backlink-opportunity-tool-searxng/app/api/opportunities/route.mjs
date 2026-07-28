import { createSheetGateway } from '../../../src/config.mjs';
import { opportunitiesRoute } from '../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function GET(request) {
  return opportunitiesRoute({ request, gateway: createSheetGateway() });
}
