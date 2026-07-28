import { getSharedConfig } from '../../../src/config.mjs';
import { accessRoute } from '../../../src/vercel-routes.mjs';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const { token } = await params;
  const config = getSharedConfig();
  return accessRoute({ token, accessToken: config.accessToken, sessionSecret: config.sessionSecret });
}
