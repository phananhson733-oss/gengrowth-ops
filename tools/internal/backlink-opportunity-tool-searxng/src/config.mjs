import { SheetGateway } from './sheet-gateway.mjs';

function required(env, name) {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function getSharedConfig(env = process.env) {
  return {
    accessToken: required(env, 'BACKLINK_ACCESS_TOKEN'),
    sessionSecret: required(env, 'BACKLINK_SESSION_SECRET'),
    googleSheetWebAppUrl: required(env, 'GOOGLE_SHEET_WEBAPP_URL'),
    googleSheetSharedSecret: required(env, 'GOOGLE_SHEET_SHARED_SECRET'),
  };
}

export function createSheetGateway(env = process.env) {
  const config = getSharedConfig(env);
  return new SheetGateway({ url: config.googleSheetWebAppUrl, sharedSecret: config.googleSheetSharedSecret });
}
