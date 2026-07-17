---
project: astrologywiki
type: archive
status: archive
owner: Ma Boyang
updated: 2026-05-14
---


  function createGenGrowthKeywordSheet() {

    var ss = SpreadsheetApp.create('GenGrowth 关键词研究主表 (科学审计版)');

  

    // ────────────────────────────────────────────

    // SHEET 1: 关键词主表

    // ────────────────────────────────────────────

    var master = ss.getActiveSheet();

    master.setName('关键词主表');

  

    // 表头

    var headers = [

      '关键词',      // A  手动输入 (Ahrefs: Keyword)

      '来源',        // B  下拉菜单 (VLOOKUP关联)

      '月搜索量',    // C  手动输入 (Ahrefs: Volume)

      'KD',          // D  手动输入 (Ahrefs: Difficulty)

      'CPC($)',      // E  手动输入 (Ahrefs: CPC)

      'Trends比值',  // F  选填 (>1.2 触发趋势)

      'SERP平均DR',  // G  选填 (直接填入Top10平均DR)

      '策略覆盖',    // H  勾选框 (强制进快速胜利桶)

      '意图词',      // I  公式自动检测

      'DR过滤',      // J  公式自动 (对比我方基准)

      '分桶',        // K  公式自动 ← 核心输出

      '内容状态',    // L  下拉菜单

      '发布URL',     // M  手动输入

      '备注'         // N  手动输入

    ];

  

    master.getRange(1, 1, 1, headers.length)

      .setValues([headers])

      .setBackground('#1a237e')

      .setFontColor('#ffffff')

      .setFontWeight('bold')

      .setFontSize(11);

    master.setFrozenRows(1);

  

    // 在 N1 预设我方 DR 基准，供 J 列公式直接引用

    // 注意：生成后你只需在 N1 单元格输入数字即可修改全表过滤逻辑

    master.getRange('N1').setValue(10);

    master.getRange('N1').setFontWeight('bold').setFontColor('#ff0000').setHorizontalAlignment('center');

    master.getRange('M1').setValue('⬅ 在此输入我方DR:');

  

    // 来源下拉

    master.getRange('B2:B500').setDataValidation(

      SpreadsheetApp.newDataValidation()

        .requireValueInList(

          ['竞品映射', '内容缺口', '种子词拓展', '社区挖掘', '趋势词', 'Social信号'],

          true

        ).build()

    );

  

    // 策略覆盖勾选框

    master.getRange('H2:H500').insertCheckboxes();

  

    // 内容状态下拉

    master.getRange('L2:L500').setDataValidation(

      SpreadsheetApp.newDataValidation()

        .requireValueInList(['未开始', '写作中', '已发布', '暂缓'], true)

        .build()

    );

  

    // ── 公式：Col I 意图词检测 ──

    var intentF =

      '=IF(A2="","",IF(OR(' +

      'ISNUMBER(SEARCH("how to",A2)),' +

      'ISNUMBER(SEARCH("fix",A2)),' +

      'ISNUMBER(SEARCH("not working",A2)),' +

      'ISNUMBER(SEARCH("best ",A2)),' +

      'ISNUMBER(SEARCH(" vs ",A2)),' +

      'ISNUMBER(SEARCH("alternative",A2)),' +

      'ISNUMBER(SEARCH("pricing",A2)),' +

      'ISNUMBER(SEARCH("review",A2)),' +

      'ISNUMBER(SEARCH("compare",A2))' +

      '),"YES","no"))';

    master.getRange('I2:I500').setFormula(intentF);

  

    // ── 公式：Col J DR过滤 (科学审计) ──

    // 逻辑：如果 G 列有数值，且比 N1 单元格的基准高出 35 分，则标记为权重墙

    var drF = '=IF(G2="", "✅通过", IF((G2 - $N$1) > 35, "❌权重墙", "✅通过"))';

    master.getRange('J2:J500').setFormula(drF);

  

    // ── 公式：Col K 分桶 ── 核心逻辑

    var bucketF =

      '=IF(A2="","",' +

      'IF(J2="❌权重墙","🎯战略攻坚",' +

      'IF(H2=TRUE,"⚡快速胜利★",' +            

      'IF(OR(B2="趋势词",B2="Social信号",AND(ISNUMBER(F2),F2>1.2)),"🚀趋势词",' +

      'IF(B2="社区挖掘","💎社区高潜",' +        

      'IF(AND(ISNUMBER(D2),D2<20,J2="✅通过",OR(AND(ISNUMBER(C2),C2>=100),I2="YES")),"⚡快速胜利",' +

      'IF(AND(ISNUMBER(D2),D2<50),"🎯战略词",' +

      '"📌长尾词")))))))';

    master.getRange('K2:K500').setFormula(bucketF);

  

    // 列宽调整

    master.setColumnWidth(1, 270);

    master.setColumnWidth(7, 100);

    master.setColumnWidth(11, 140);

    master.setColumnWidth(13, 220);

  

    // 条件格式着色

    var bucketRange = master.getRange('K2:K500');

    var rules = master.getConditionalFormatRules();

    var ruleColors = [

      { text: '🚀趋势词',     bg: '#c8e6c9' },

      { text: '💎社区高潜',   bg: '#e1f5fe' },

      { text: '⚡快速胜利★',  bg: '#fff59d' },

      { text: '⚡快速胜利',   bg: '#fff9c4' },

      { text: '🎯战略攻坚',   bg: '#f5f5f5' },

      { text: '🎯战略词',     bg: '#bbdefb' },

      { text: '📌长尾词',     bg: '#fce4ec' },

      { text: '❌权重墙',     bg: '#f5f5f5' }

    ];

    ruleColors.forEach(function(r) {

      rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains(r.text).setBackground(r.bg).setRanges([bucketRange]).build());

    });

    master.setConditionalFormatRules(rules);

  

    // ────────────────────────────────────────────

    // 视图表生成 (修复 FILTER 逻辑)

    // ────────────────────────────────────────────

  

    var trendSh = ss.insertSheet('🚀趋势词库');

    trendSh.getRange('A1').setFormula("=IFERROR(FILTER('关键词主表'!A2:N500, '关键词主表'!K2:K500=\"🚀趋势词\"), \"暂无趋势数据\")");

    _styleViewSheet(trendSh, '#e8f5e9', '趋势词 — 来源驱动或比值爆发，优先执行');

  

    var commSh = ss.insertSheet('💎社区高潜');

    commSh.getRange('A1').setFormula("=IFERROR(FILTER('关键词主表'!A2:N500, '关键词主表'!K2:K500=\"💎社区高潜\"), \"暂无社区数据\")");

    _styleViewSheet(commSh, '#e1f5fe', '社区原话 — 转化率极高，Ahrefs数据可能为0');

  

    var qwSh = ss.insertSheet('⚡快速胜利');

    qwSh.getRange('A1').setFormula("=IFERROR(SORT(FILTER('关键词主表'!A2:N500, REGEXMATCH('关键词主表'!K2:K500, \"快速胜利\")), 3, FALSE), \"暂无快速胜利词\")");

    _styleViewSheet(qwSh, '#fff9c4', '快速胜利 — 低KD且权重匹配，Week 1-4 核心战场');

  

    var stratSh = ss.insertSheet('🎯战略词');

    // 修复：使用 REGEXMATCH 处理多重条件过滤

    stratSh.getRange('A1').setFormula("=IFERROR(SORT(FILTER('关键词主表'!A2:N500, REGEXMATCH('关键词主表'!K2:K500, \"🎯战略\")), 5, FALSE), \"暂无战略词\")");

    _styleViewSheet(stratSh, '#e3f2fd', '战略词 — 包含需要内容攻坚或突破权重墙的词');

  

    var trackSh = ss.insertSheet('📊内容追踪');

    var trackHeaders = ['关键词', '分桶', '发布日期', '内容URL', 'KD', '月搜索量', '预期排名', '预期流量', '实际排名', '备注'];

    trackSh.getRange(1, 1, 1, trackHeaders.length).setValues([trackHeaders]).setBackground('#37474f').setFontColor('#ffffff').setFontWeight('bold');

    trackSh.setFrozenRows(1);

    trackSh.setColumnWidth(1, 250); trackSh.setColumnWidth(4, 250);

  

    var srcSh = ss.insertSheet('📈来源分析');

    srcSh.getRange(1, 1, 1, 6).setValues([['来源', '执行词数', '已发布', '命中(P1-P30)', '命中率', '下次是否加大投入？']]).setBackground('#37474f').setFontColor('#ffffff').setFontWeight('bold');

    var sources = ['竞品映射', '内容缺口', '种子词拓展', '社区挖掘', '趋势词', 'Social信号'];

    for (var i = 0; i < sources.length; i++) {

      var row = i + 2;

      srcSh.getRange(row, 1).setValue(sources[i]);

      srcSh.getRange(row, 5).setFormula('=IF(B' + row + '=0,"",TEXT(D' + row + '/B' + row + ',"0.0%"))');

    }

    srcSh.getRange(8, 1, 1, 5).setValues([['合计','=SUM(B2:B7)','=SUM(C2:C7)','=SUM(D2:D7)','=IF(B8=0,"",TEXT(D8/B8,"0.0%"))']]).setFontWeight('bold').setBackground('#eceff1');

    srcSh.setColumnWidth(1, 120); srcSh.setColumnWidth(6, 180);

  

    Logger.log('✅ 创建成功：' + ss.getUrl());

  }

  

  function _styleViewSheet(sheet, color, note) {

    sheet.insertRowBefore(1);

    sheet.getRange('A1').setValue('⬆ 数据自动填充 | ' + note);

    sheet.getRange('A1:N1').setBackground(color).setFontStyle('italic').setFontColor('#555555');

    sheet.setFrozenRows(1);

  }