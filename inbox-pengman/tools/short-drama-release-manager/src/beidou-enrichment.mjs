import { ShortDramaError } from './errors.mjs';

const PLATFORM_NAMES = Object.freeze({ reelshort: 'ReelShort', dramabox: 'DramaBox', shortmax: 'ShortMax',
  topshort: 'TopShort', moboreels: 'MoboReels' });
const LANGUAGE_NAMES = Object.freeze({ 2: '英语', 3: '印尼语', 4: '西班牙语', 5: '法语', 6: '泰语',
  7: '葡萄牙语', 8: '韩语', 9: '日语', 10: '阿拉伯语', 11: '德语', 12: '繁中', 13: '俄语', 14: '意大利语',
  16: '越南语', 19: '土耳其语', 21: '罗马尼亚语', 22: '波兰语', 24: '捷克语' });

function empty(value) { return value === null || value === undefined || value === '' || Array.isArray(value) && value.length === 0; }

function validDatePart(value) {
  if (typeof value !== 'string') return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < '0001-01-01') return null;
  const timestamp = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === day ? day : null;
}

export function beidouLanguageName(id) { return LANGUAGE_NAMES[id] ?? null; }
export function beidouPlatformName(id) { return PLATFORM_NAMES[id] ?? null; }
export function beidouDatePart(value) { return validDatePart(value); }

function categories(candidate, allowed) {
  const found = new Set();
  for (const input of [candidate.category, candidate.tag]) {
    if (typeof input !== 'string') continue;
    for (const part of input.split(/[,，、/|;；\n]+|\s+·\s+/)) {
      const name = part.trim();
      if (allowed.has(name)) found.add(name);
    }
  }
  return [...found];
}

/** Only values already allowed by the live Base field catalog are eligible. */
export function candidatePatch(candidate, fields, options) {
  if (!candidate || !fields || !options) throw new ShortDramaError('beidou_mapping_invalid', 'Beidou mapping inputs are missing');
  const platformAllowed = new Set(options.platforms ?? []);
  const languageAllowed = new Set(options.languages ?? []);
  const categoryAllowed = new Set(options.categories ?? []);
  const patch = {};
  const platform = beidouPlatformName(candidate.platform);
  if (empty(fields.平台) && platform && platformAllowed.has(platform)) patch.平台 = platform;
  const language = beidouLanguageName(candidate.languageId);
  if (empty(fields.语言) && language && languageAllowed.has(language)) patch.语言 = language;
  const tags = categories(candidate, categoryAllowed);
  if (empty(fields.剧分类) && tags.length) patch.剧分类 = tags;
  const date = validDatePart(candidate.publishAt);
  if (empty(fields.上线日期) && date) patch.上线日期 = date;
  return patch;
}

export function formatCandidateList(rows, { prioritizeId = null } = {}) {
  if (!Array.isArray(rows)) throw new ShortDramaError('beidou_response_invalid', 'Candidate list is malformed');
  const preferred = prioritizeId ? rows.find((row) => row.sourceId === prioritizeId) : null;
  const ordered = preferred ? [preferred, ...rows.filter((row) => row !== preferred)] : rows;
  const lines = [];
  for (const row of ordered) {
    if (lines.length >= 50) break;
    const day = validDatePart(row.publishAt) ?? '日期未知';
    const safeTitle = String(row.title ?? '').replace(/[\u0000-\u001f\u007f|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
    const line = `${lines.length + 1}. ${safeTitle} | ${row.platform} | 语言ID ${row.languageId ?? '未知'} | ${day} | ID ${row.sourceId}`;
    if ([...lines, line].join('\n').length > 7_500) break;
    lines.push(line);
  }
  if (lines.length < rows.length) lines.push(`候选共 ${rows.length} 条，仅显示前 ${lines.length} 条；请缩小剧名或补充版本后确认。`);
  return lines.join('\n');
}
