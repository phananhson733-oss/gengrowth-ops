import { ShortDramaError } from "./errors.mjs";

const frozenArray = (values) => Object.freeze([...values]);
const frozenOptions = (options) => Object.freeze(Object.fromEntries(
  Object.entries(options).map(([name, values]) => [name, frozenArray(values)])
));
const table = (primaryField, human, machine, shared, derived, options = {}) => Object.freeze({
  primaryField,
  human: frozenArray(human),
  machine: frozenArray(machine),
  shared: frozenArray(shared),
  derived: frozenArray(derived),
  options: frozenOptions(options),
});

const field = (name, kind, details = {}) => Object.freeze({ name, kind, ...details });
const storage = (name, kind, details = {}) => field(name, kind, { phase: "storage", ...details });
const link = (name, targetTable, details = {}) => field(name, "link", { phase: "link", targetTable, ...details });
const lookup = (name, linkField, sourceField) => field(name, "lookup", {
  phase: "lookup_formula",
  linkField,
  sourceField,
});
const formula = (name, expression) => field(name, "formula", { phase: "lookup_formula", expression });
const system = (name, details = {}) => field(name, "system", { phase: "system", ...details });

const SELECT_OPTIONS = Object.freeze({
  accountLedgerStatus: frozenArray(["未发", "重养", "发布中"]),
  dramaAccountStatus: frozenArray(["未发", "重养", "发布中"]),
  syncStatus: frozenArray(["success", "partial", "failed"]),
  platform: frozenArray(["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他"]),
  recommender: frozenArray(["彭满", "高璇", "马博洋"]),
  archiveStatus: frozenArray(["active", "archived"]),
  business: frozenArray(["short-drama"]),
  collectionStatus: frozenArray(["complete", "partial"]),
  missingField: frozenArray(["views", "likes", "comments", "favorites", "shares"]),
  matchMethod: frozenArray(["exact_post_id", "manual_url", "account_time"]),
});
const selected = (name, kind, options, details = {}) => storage(name, kind, {
  ...details,
  options,
});

export const TABLE_ORDER = Object.freeze(["账号台账", "选剧池", "采集数据", "发布记录"]);
export const SCHEMA_APPLY_ORDER = Object.freeze(["storage", "link", "lookup_formula", "system", "view_dashboard"]);
const PATCH_ACTOR_KINDS = Object.freeze(["human", "machine", "migration"]);

export const TABLES = Object.freeze({
  "账号台账": table(
    "账号ID",
    ["账号名", "所属组", "定位垂类", "表现形式", "状态"],
    ["账号ID", "粉丝数", "数据日期", "指标同步时间", "同步状态"],
    ["主页链接"],
    [],
    { 状态: SELECT_OPTIONS.accountLedgerStatus, 同步状态: SELECT_OPTIONS.syncStatus }
  ),
  "选剧池": table(
    "剧ID",
    [
      "剧名", "剧分类", "上线日期", "生命周期", "备注", "推荐理由",
      "RS Boost 分类（待确认）", "账号组", "账号状态", "平台", "语言",
      "来源", "推荐人", "归档状态",
    ],
    ["剧ID"],
    [],
    ["是否已排期", "关联发布记录", "创建人", "创建时间", "最后修改时间"],
    {
      账号状态: SELECT_OPTIONS.dramaAccountStatus,
      平台: SELECT_OPTIONS.platform,
      推荐人: SELECT_OPTIONS.recommender,
      归档状态: SELECT_OPTIONS.archiveStatus,
    }
  ),
  "采集数据": table(
    "Post ID",
    [],
    [
      "Post ID", "快照日期", "采集时间", "账号", "视频链接", "发布时间",
      "播放量", "点赞", "评论", "收藏", "转发", "业务", "采集状态",
      "缺失字段", "来源 run_id", "Base 同步时间",
    ],
    [],
    ["账号名", "关联发布记录"],
    {
      业务: SELECT_OPTIONS.business,
      采集状态: SELECT_OPTIONS.collectionStatus,
      缺失字段: SELECT_OPTIONS.missingField,
    }
  ),
  "发布记录": table(
    "发布ID",
    ["日期", "账号", "剧", "剧ID（RS Boost）", "RS收益", "备注", "归档状态"],
    ["发布ID", "采集记录", "匹配方式", "匹配置信度", "指标同步时间", "同步错误"],
    ["视频链接", "Post ID"],
    ["账号名", "主页链接", "剧ID", "剧名", "剧分类", "播放量", "点赞", "收藏", "转发", "评论", "发布状态", "指标日期"],
    { 匹配方式: SELECT_OPTIONS.matchMethod, 归档状态: SELECT_OPTIONS.archiveStatus }
  ),
});

export const BASE_FIELD_SPECS = Object.freeze({
  "账号台账": Object.freeze([
    storage("账号ID", "text", { primary: true }), storage("账号名", "text"), storage("主页链接", "url"),
    storage("粉丝数", "number"), storage("所属组", "single_select"), storage("定位垂类", "text"),
    storage("表现形式", "single_select"), selected("状态", "single_select", SELECT_OPTIONS.accountLedgerStatus), storage("数据日期", "date"),
    storage("指标同步时间", "datetime"), selected("同步状态", "single_select", SELECT_OPTIONS.syncStatus),
  ]),
  "选剧池": Object.freeze([
    storage("剧ID", "text", { primary: true }), storage("剧名", "text"), storage("剧分类", "multi_select"),
    storage("上线日期", "date"), storage("生命周期", "single_select"), storage("备注", "text"),
    storage("推荐理由", "text"), storage("RS Boost 分类（待确认）", "multi_select"), storage("账号组", "multi_select"),
    selected("账号状态", "single_select", SELECT_OPTIONS.dramaAccountStatus), selected("平台", "single_select", SELECT_OPTIONS.platform), storage("语言", "single_select"),
    storage("来源", "multi_select"), selected("推荐人", "multi_select", SELECT_OPTIONS.recommender), selected("归档状态", "single_select", SELECT_OPTIONS.archiveStatus),
    link("关联发布记录", "发布记录", { managedReverseOf: Object.freeze({ table: "发布记录", field: "剧" }) }),
    formula("是否已排期", "IF(ISBLANK([关联发布记录]),\"否\",\"是\")"),
    system("创建人", { systemType: "created_by" }), system("创建时间", { systemType: "created_at" }),
    system("最后修改时间", { systemType: "updated_at" }),
  ]),
  "采集数据": Object.freeze([
    storage("Post ID", "text", { primary: true }), storage("快照日期", "date"), storage("采集时间", "datetime"),
    storage("视频链接", "url"), storage("发布时间", "datetime"), storage("播放量", "number"),
    storage("点赞", "number"), storage("评论", "number"), storage("收藏", "number"), storage("转发", "number"),
    selected("业务", "single_select", SELECT_OPTIONS.business), selected("采集状态", "single_select", SELECT_OPTIONS.collectionStatus), selected("缺失字段", "multi_select", SELECT_OPTIONS.missingField),
    storage("来源 run_id", "text"), storage("Base 同步时间", "datetime"), link("账号", "账号台账"),
    link("关联发布记录", "发布记录", { managedReverseOf: Object.freeze({ table: "发布记录", field: "采集记录" }) }),
    lookup("账号名", "账号", "账号名"),
  ]),
  "发布记录": Object.freeze([
    storage("发布ID", "text", { primary: true }), storage("日期", "datetime"), storage("剧ID（RS Boost）", "text"),
    storage("视频链接", "url"), storage("Post ID", "text"), storage("RS收益", "number"), storage("备注", "text"),
    selected("匹配方式", "single_select", SELECT_OPTIONS.matchMethod), storage("匹配置信度", "number"), storage("指标同步时间", "datetime"),
    storage("同步错误", "text"), selected("归档状态", "single_select", SELECT_OPTIONS.archiveStatus), link("账号", "账号台账"),
    link("剧", "选剧池", { bidirectional: true, reverseField: "关联发布记录" }),
    link("采集记录", "采集数据", { bidirectional: true, reverseField: "关联发布记录" }),
    lookup("账号名", "账号", "账号名"),
    lookup("主页链接", "账号", "主页链接"), lookup("剧ID", "剧", "剧ID"), lookup("剧名", "剧", "剧名"),
    lookup("剧分类", "剧", "剧分类"), lookup("播放量", "采集记录", "播放量"), lookup("点赞", "采集记录", "点赞"),
    lookup("收藏", "采集记录", "收藏"), lookup("转发", "采集记录", "转发"), lookup("评论", "采集记录", "评论"),
    lookup("指标日期", "采集记录", "快照日期"),
    formula("发布状态", "IF(AND(OR([Post ID]=\"\",ISBLANK([Post ID])),OR([视频链接]=\"\",ISBLANK([视频链接])),ISBLANK([采集记录])),IF([日期]>NOW(),\"已排期\",\"待公开\"),IF(AND(NOT(ISBLANK([播放量])),NOT(ISBLANK([点赞])),NOT(ISBLANK([收藏])),NOT(ISBLANK([转发])),NOT(ISBLANK([评论]))),\"已回填\",\"已公开\"))"),
  ]),
});

export function fieldOwner(tableName, fieldName) {
  const definition = TABLES[tableName];
  if (!definition) throw new ShortDramaError("table_not_allowed", "Unknown table", { table: tableName });
  for (const owner of ["human", "machine", "shared", "derived"]) {
    if (definition[owner].includes(fieldName)) return owner;
  }
  throw new ShortDramaError("field_not_allowed", "Unknown field", { table: tableName, field: fieldName });
}

export function assertPatchAllowed(tableName, patch, actorKind) {
  if (!PATCH_ACTOR_KINDS.includes(actorKind)) {
    throw new ShortDramaError("actor_kind_not_allowed", "Actor kind is not allowed", {
      actor_kind: actorKind,
    });
  }
  for (const fieldName of Object.keys(patch)) {
    const owner = fieldOwner(tableName, fieldName);
    const allowed =
      (actorKind === "migration" && ["human", "machine", "shared"].includes(owner)) ||
      (owner === actorKind && actorKind !== "migration") ||
      (owner === "shared" && actorKind === "human");
    if (!allowed) {
      throw new ShortDramaError("field_owner_violation", "Field owner mismatch", {
        table: tableName,
        field: fieldName,
        expected_owner: owner,
        actor_kind: actorKind,
      });
    }
    const options = TABLES[tableName].options[fieldName];
    if (options && patch[fieldName] !== null) {
      const spec = BASE_FIELD_SPECS[tableName].find((candidate) => candidate.name === fieldName);
      const values = spec?.kind === "multi_select" ? patch[fieldName] : [patch[fieldName]];
      if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !options.includes(value)) ||
          spec?.kind === "multi_select" && new Set(values).size !== values.length) {
        throw new ShortDramaError("field_option_violation", "Field value is outside the fixed select options", {
          table: tableName,
          field: fieldName,
        });
      }
    }
  }
}
