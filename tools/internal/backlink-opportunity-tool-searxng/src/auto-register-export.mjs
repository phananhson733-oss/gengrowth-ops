export const AUTO_REGISTER_HEADERS = [
  '页面AS',
  '原URL',
  'URL对应域名',
  '目标域名',
  '类型',
  '外部链接数量',
  '自动评论运行结果',
];

export function normaliseTargetDomain(value) {
  const input = String(value || '').trim();
  if (!input || /\s/.test(input)) throw new Error('目标域名格式不正确');
  try {
    const hostname = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`).hostname.toLowerCase();
    if (!hostname.includes('.')) throw new Error('invalid hostname');
    return hostname;
  } catch {
    throw new Error('目标域名格式不正确');
  }
}

function domainFromUrl(value) {
  try {
    return new URL(String(value || '')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function toAutoRegisterRows(records = [], { targetDomain }) {
  const target = normaliseTargetDomain(targetDomain);
  return records.filter((record) => record.machine_status === 'qualified').flatMap((record) => {
    const originalUrl = String(record.referring_page_url || '').trim();
    const sourceDomain = String(record.referring_domain || '').trim().toLowerCase() || domainFromUrl(originalUrl);
    if (!originalUrl || !sourceDomain) return [];
    const externalLinks = record.external_link_count !== null
      && record.external_link_count !== undefined
      && record.external_link_count !== ''
      && Number.isFinite(Number(record.external_link_count))
      ? Number(record.external_link_count)
      : '';
    return [{
      页面AS: '',
      原URL: originalUrl,
      URL对应域名: sourceDomain,
      目标域名: target,
      类型: String(record.opportunity_type || ''),
      外部链接数量: externalLinks,
      自动评论运行结果: '',
    }];
  });
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toAutoRegisterCsv(rows = []) {
  const lines = [
    AUTO_REGISTER_HEADERS.join(','),
    ...rows.map((row) => AUTO_REGISTER_HEADERS.map((header) => escapeCsv(row[header])).join(',')),
  ];
  return `\ufeff${lines.join('\r\n')}\r\n`;
}
