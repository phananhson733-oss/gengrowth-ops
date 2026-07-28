import { createSheetGateway } from '../../../../../src/config.mjs';
import { jobResultRoute } from '../../../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const { jobId } = await params;
  return jobResultRoute({ jobId, gateway: createSheetGateway() });
}
