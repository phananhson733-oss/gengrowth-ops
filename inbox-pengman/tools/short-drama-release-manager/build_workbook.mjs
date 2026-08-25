import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = process.argv[2] || path.resolve("output/short-drama-release-manager");
await fs.mkdir(outputDir, { recursive: true });

const accounts = [
  ["dramadetour0", "https://www.tiktok.com/@dramadetour0", 274, "A纯切片", "待分配垂类包", "AI真人剧", "未发", "2026-08-21"],
  ["user3127916753059", "https://www.tiktok.com/@user3127916753059", 249, "A纯切片", "待分配垂类包", "AI真人剧", "未发", "2026-08-21"],
  ["user4485806813444", "https://www.tiktok.com/@user4485806813444", 263, "A纯切片", "待分配垂类包", "AI真人剧", "未发", "2026-08-21"],
  ["user47225225594035", "https://www.tiktok.com/@user47225225594035", 1217, "A纯切片", "待分配垂类包", "AI真人剧", "未发", "2026-08-21"],
  ["user2942394775979", "https://www.tiktok.com/@user2942394775979", 273, "B生活", "生活内容 + 短剧切片", "AI真人剧", "发布中", "2026-08-21"],
  ["shirley5276973", "https://www.tiktok.com/@shirley5276973", 0, "B生活", "生活内容 + 短剧切片", "AI真人剧", "发布中", "2026-08-21"],
  ["shirley527146", "https://www.tiktok.com/@shirley527146", 0, "C测试", "测评 / 排名 / 吐槽", "AI真人剧", "养号中", "2026-08-21"],
  ["shirley5278789", "https://www.tiktok.com/@shirley5278789", 0, "C测试", "测评 / 排名 / 吐槽", "AI真人剧", "未发", "2026-08-21"],
  ["filestarsx", "https://www.tiktok.com/@filestarsx", 2, "D重养", "重养后再分配", "AI真人剧", "重养", "2026-08-21"],
];

const capturedPosts = [
  ["2026-08-21", "shirley527146", "7662213851680738574", "https://www.tiktok.com/@shirley527146/video/7662213851680738574", 138, 0, 0, 0, 0],
  ["2026-08-21", "shirley527146", "7662319263247568141", "https://www.tiktok.com/@shirley527146/video/7662319263247568141", 189, 1, 0, 1, 0],
  ["2026-08-21", "shirley527146", "7662650075671317774", "https://www.tiktok.com/@shirley527146/video/7662650075671317774", 190, 3, 0, 0, 0],
  ["2026-08-21", "shirley527146", "7663456266794142990", "https://www.tiktok.com/@shirley527146/video/7663456266794142990", 0, 0, 0, 0, 0],
  ["2026-08-21", "shirley5276973", "7675697074368744718", "https://www.tiktok.com/@shirley5276973/video/7675697074368744718", 3409, 179, 0, 5, 2],
  ["2026-08-21", "user2942394775979", "7674889997429853470", "https://www.tiktok.com/@user2942394775979/video/7674889997429853470", 911, 36, 1, 1, 1],
  ["2026-08-21", "user2942394775979", "7674917014472822046", "https://www.tiktok.com/@user2942394775979/video/7674917014472822046", 1007, 100, 0, 4, 1],
];

const categories = ["爱情", "霸总", "复仇", "狼人", "逆袭", "离婚", "重生", "战神", "甜宠", "豪门", "契约婚姻", "校园", "职场", "奇幻", "悬疑", "其他"];
const accountNames = accounts.map((row) => row[0]);

const wb = Workbook.create();
const accountsSheet = wb.worksheets.add("账号台账");
const releasesSheet = wb.worksheets.add("发布记录");
const titlesSheet = wb.worksheets.add("选剧池");
const captureSheet = wb.worksheets.add("_采集数据");

const headerFormat = {
  fill: "#E8EAED",
  font: { bold: true, color: "#202124" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#BDC1C6" },
};
const inputFill = "#FFF8E1";
const formulaFill = "#E8F0FE";

accountsSheet.showGridLines = false;
accountsSheet.getRange("A1:H10").values = [
  ["账号名", "主页链接", "粉丝数", "所属组", "定位垂类", "表现形式", "状态", "数据日期"],
  ...accounts,
];
accountsSheet.getRange("A1:H1").format = headerFormat;
accountsSheet.getRange("A2:H10").format.borders = { preset: "inside", style: "thin", color: "#E0E0E0" };
accountsSheet.getRange("C2:C10").format.numberFormat = "#,##0";
accountsSheet.getRange("H2:H10").format.numberFormat = "yyyy-mm-dd";
accountsSheet.getRange("D2:D10").dataValidation = { rule: { type: "list", values: ["A纯切片", "B生活", "C测试", "D重养"] } };
accountsSheet.getRange("F2:F10").dataValidation = { rule: { type: "list", values: ["AI真人剧", "AI漫剧"] } };
accountsSheet.getRange("G2:G10").dataValidation = { rule: { type: "list", values: ["未发", "养号中", "发布中", "重养"] } };
accountsSheet.getRange("A1:H10").format.wrapText = true;
accountsSheet.getRange("A1:H10").format.autofitColumns();
accountsSheet.getRange("A:A").format.columnWidth = 22;
accountsSheet.getRange("B:B").format.columnWidth = 38;
accountsSheet.getRange("E:E").format.columnWidth = 24;
accountsSheet.freezePanes.freezeRows(1);
accountsSheet.tables.add("A1:H10", true, "AccountsLedger");

const releaseHeaders = [
  "日期", "账号名", "主页链接", "剧名", "剧ID（RS Boost）", "剧分类", "视频链接", "Post ID",
  "播放量", "点赞", "收藏", "转发", "评论",
  "手动播放", "手动点赞", "手动收藏", "手动转发", "手动评论",
  "RS收益", "备注", "数据状态",
];
releasesSheet.showGridLines = false;
releasesSheet.getRange("A1:U1").values = [releaseHeaders];
releasesSheet.getRange("A1:U1").format = headerFormat;
releasesSheet.getRange("A1:U1").format.rowHeight = 36;
releasesSheet.getRange("A2:U101").format.borders = { preset: "inside", style: "thin", color: "#EEEEEE" };
releasesSheet.getRange("A2:A101").format.numberFormat = "yyyy-mm-dd";
releasesSheet.getRange("I2:R101").format.numberFormat = "#,##0";
releasesSheet.getRange("S2:S101").format.numberFormat = "#,##0.00";
releasesSheet.getRange("H2:H101").format.numberFormat = "@";
releasesSheet.getRange("A2:B101").format.fill = inputFill;
releasesSheet.getRange("D2:G101").format.fill = inputFill;
releasesSheet.getRange("N2:T101").format.fill = inputFill;
releasesSheet.getRange("C2:C101").format.fill = formulaFill;
releasesSheet.getRange("H2:M101").format.fill = formulaFill;
releasesSheet.getRange("U2:U101").format.fill = formulaFill;
releasesSheet.getRange("B2:B101").dataValidation = { rule: { type: "list", values: accountNames } };
releasesSheet.getRange("F2:F101").dataValidation = { rule: { type: "list", values: categories } };

releasesSheet.getRange("C2").formulas = [["=IF(B2=\"\",\"\",IFERROR(VLOOKUP(B2,'账号台账'!$A$2:$B$10,2,FALSE),\"\"))"]];
releasesSheet.getRange("C2:C101").fillDown();
releasesSheet.getRange("H2").formulas = [["=IF(G2=\"\",\"\",IFERROR(RIGHT(LEFT(G2,FIND(\"?\",G2&\"?\")-1),19),\"\"))"]];
releasesSheet.getRange("H2:H101").fillDown();
const lookupFormulas = [
  "=IF($H2=\"\",\"\",IF($N2<>\"\",$N2,IFERROR(VLOOKUP($H2,'_采集数据'!$C$2:$I$500,4,FALSE),\"\")))",
  "=IF($H2=\"\",\"\",IF($O2<>\"\",$O2,IFERROR(VLOOKUP($H2,'_采集数据'!$C$2:$I$500,5,FALSE),\"\")))",
  "=IF($H2=\"\",\"\",IF($P2<>\"\",$P2,IFERROR(VLOOKUP($H2,'_采集数据'!$C$2:$I$500,7,FALSE),\"\")))",
  "=IF($H2=\"\",\"\",IF($Q2<>\"\",$Q2,IFERROR(VLOOKUP($H2,'_采集数据'!$C$2:$I$500,8,FALSE),\"\")))",
  "=IF($H2=\"\",\"\",IF($R2<>\"\",$R2,IFERROR(VLOOKUP($H2,'_采集数据'!$C$2:$I$500,6,FALSE),\"\")))",
];
releasesSheet.getRange("I2:M2").formulas = [lookupFormulas];
releasesSheet.getRange("I2:M101").fillDown();
releasesSheet.getRange("U2").formulas = [["=IF(H2=\"\",\"待填视频链接\",IF(COUNTA(N2:R2)>0,\"手动优先\",IF(COUNTIF('_采集数据'!$C$2:$C$500,H2)>0,\"采集已匹配\",\"待采集\")))"]];
releasesSheet.getRange("U2:U101").fillDown();
releasesSheet.getRange("A1:U101").format.wrapText = true;
releasesSheet.getRange("A1:U101").format.autofitColumns();
releasesSheet.getRange("A:A").format.columnWidth = 13;
releasesSheet.getRange("B:B").format.columnWidth = 22;
releasesSheet.getRange("C:C").format.columnWidth = 34;
releasesSheet.getRange("D:D").format.columnWidth = 24;
releasesSheet.getRange("G:G").format.columnWidth = 42;
releasesSheet.getRange("H:H").format.columnWidth = 22;
releasesSheet.getRange("I:S").format.columnWidth = 12;
releasesSheet.getRange("T:T").format.columnWidth = 28;
releasesSheet.getRange("U:U").format.columnWidth = 16;
releasesSheet.freezePanes.freezeRows(1);
releasesSheet.freezePanes.freezeColumns(2);
releasesSheet.tables.add("A1:U101", true, "ReleaseRecords");

titlesSheet.showGridLines = false;
titlesSheet.getRange("A1:G2").values = [
  ["剧名", "剧ID", "剧分类", "上线日期", "生命周期", "是否已排期", "备注"],
  ["", "", "", "", "待评估", "否", ""],
];
titlesSheet.getRange("A1:G1").format = headerFormat;
titlesSheet.getRange("A2:G101").format.fill = inputFill;
titlesSheet.getRange("C2:C101").dataValidation = { rule: { type: "list", values: categories } };
titlesSheet.getRange("E2:E101").dataValidation = { rule: { type: "list", values: ["待评估", "新剧", "在推", "衰退", "停止"] } };
titlesSheet.getRange("F2:F101").dataValidation = { rule: { type: "list", values: ["是", "否"] } };
titlesSheet.getRange("D2:D101").format.numberFormat = "yyyy-mm-dd";
titlesSheet.getRange("J1:J17").values = [["RS Boost 分类（待确认）"], ...categories.map((v) => [v])];
titlesSheet.getRange("L1:L5").values = [["账号组"], ["A纯切片"], ["B生活"], ["C测试"], ["D重养"]];
titlesSheet.getRange("N1:N5").values = [["账号状态"], ["未发"], ["养号中"], ["发布中"], ["重养"]];
titlesSheet.getRange("J1:J1").format = headerFormat;
titlesSheet.getRange("L1:L1").format = headerFormat;
titlesSheet.getRange("N1:N1").format = headerFormat;
titlesSheet.getRange("A1:N101").format.wrapText = true;
titlesSheet.getRange("A1:N101").format.autofitColumns();
titlesSheet.getRange("A:A").format.columnWidth = 28;
titlesSheet.getRange("G:G").format.columnWidth = 30;
titlesSheet.freezePanes.freezeRows(1);
titlesSheet.tables.add("A1:G101", true, "DramaPool");

captureSheet.showGridLines = false;
captureSheet.getRange(`A1:I${capturedPosts.length + 1}`).values = [
  ["快照日期", "账号名", "Post ID", "视频链接", "播放量", "点赞", "评论", "收藏", "转发"],
  ...capturedPosts.map((row) => [row[0], row[1], null, ...row.slice(3)]),
];
captureSheet.getRange(`C2:C${capturedPosts.length + 1}`).formulas = capturedPosts.map((row) => [`=\"${row[2]}\"`]);
captureSheet.getRange("A1:I1").format = headerFormat;
captureSheet.getRange(`A2:I${capturedPosts.length + 1}`).format.fill = "#F8F9FA";
captureSheet.getRange(`E2:I${capturedPosts.length + 1}`).format.numberFormat = "#,##0";
captureSheet.getRange(`C2:C${capturedPosts.length + 1}`).format.numberFormat = "@";
captureSheet.getRange(`A1:I${capturedPosts.length + 1}`).format.autofitColumns();
captureSheet.getRange("C:C").format.columnWidth = 24;
captureSheet.getRange("D:D").format.columnWidth = 46;
captureSheet.freezePanes.freezeRows(1);
captureSheet.tables.add(`A1:I${capturedPosts.length + 1}`, true, "CapturedMetrics");

const checks = [];
checks.push((await wb.inspect({ kind: "table", range: "账号台账!A1:H10", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 10 })).ndjson);
checks.push((await wb.inspect({ kind: "table", range: "发布记录!A1:U4", include: "values,formulas", tableMaxRows: 5, tableMaxCols: 22 })).ndjson);
checks.push((await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "final formula error scan" })).ndjson);
await fs.writeFile(path.join(outputDir, "verification.ndjson"), checks.join("\n"), "utf8");

for (const [sheetName, range] of [["账号台账", "A1:H10"], ["发布记录", "A1:U12"], ["选剧池", "A1:N18"], ["_采集数据", `A1:I${capturedPosts.length + 1}`]]) {
  const preview = await wb.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir, "短剧发行管理_MVP.xlsx"));

console.log(JSON.stringify({ outputDir, workbook: path.join(outputDir, "短剧发行管理_MVP.xlsx") }, null, 2));
