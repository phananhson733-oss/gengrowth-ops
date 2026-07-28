import { createSheetGateway } from '../../../../src/config.mjs';
import { createDiscoveryRoute } from '../../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  const { mode } = await params;
  return createDiscoveryRoute({ mode, request, gateway: createSheetGateway() });
}
