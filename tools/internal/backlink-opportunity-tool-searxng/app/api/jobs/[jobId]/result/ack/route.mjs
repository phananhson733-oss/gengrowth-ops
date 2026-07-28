import { createSheetGateway } from '../../../../../../src/config.mjs';
import { ackJobResultRoute } from '../../../../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function POST(_request, { params }) {
  const { jobId } = await params;
  return ackJobResultRoute({ jobId, gateway: createSheetGateway() });
}
