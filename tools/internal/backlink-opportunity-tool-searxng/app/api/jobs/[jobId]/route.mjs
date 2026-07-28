import { createSheetGateway } from '../../../../src/config.mjs';
import { jobRoute } from '../../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const { jobId } = await params;
  return jobRoute({ jobId, gateway: createSheetGateway() });
}
