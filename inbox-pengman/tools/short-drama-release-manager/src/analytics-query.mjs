import {ANALYTICS_TABLES,beijingDate,readAnalytics} from './analytics.mjs';
import {ShortDramaError} from './errors.mjs';
const fail=message=>{throw new ShortDramaError('analytics_query_invalid',message);};
const REPORTS={
 'by-account':{name:'账号台账',binding:'accounts',key:'账号ID'},
 'by-drama':{...ANALYTICS_TABLES.dramas,binding:'dramas',key:'剧ID'},
 daily:{name:'每日播放趋势',date:'日期'},
 'daily-by-account':{...ANALYTICS_TABLES.accountDaily,binding:'accountDaily',key:'账号ID',date:'日期'},
 'release-trend':{...ANALYTICS_TABLES.releaseDays,binding:'releaseDays',date:'日期'},
 'first-release-trend':{...ANALYTICS_TABLES.firstDays,binding:'firstDays',date:'首次发布日期'},
};
export async function queryAnalyticsReport({client,config,action,key,date,now=new Date()}){
 if(action==='quality'){
  if(key||date)fail('质量查询不接受筛选');const data=await readAnalytics({client,config,now});
  return {status:data.issues.length||data.metadata_issues.length?'partial':'success',source:'base_analytics_source',readback:'complete',eligible_releases:data.eligible_releases,issues:data.issues,metadata_issues:data.metadata_issues};
 }
 const spec=REPORTS[action];if(!spec)fail('未知统计报表');
 if(key&&!spec.key)fail('此报表不支持账号或剧筛选');
 if(date&&(!spec.date||!/^\d{4}-\d{2}-\d{2}$/.test(date)))fail('此报表不支持该日期筛选');
 if(date)beijingDate(date);
 const tableId=action==='by-account'?config.base.tableIds.accounts:action==='daily'?config.base.dailyViewsTableId:config.base.analyticsTableIds?.[spec.binding];
 if(!tableId)fail('统计表未配置');
 const result=await client.listRecords(config.base.appToken,tableId);if(!result.complete||!Array.isArray(result.items))fail('统计查询不完整');
 let rows=result.items.map(r=>r.fields);
 if(key)rows=rows.filter(r=>r[spec.key]===key);
 if(date)rows=rows.filter(r=>beijingDate(r[spec.date])===date);
 const metadataMissing=action==='by-drama'&&rows.some(r=>['剧分类','所属平台','上线日期'].some(k=>!r[k]));
 const partial=metadataMissing||rows.some(r=>/缺失|缺少|暂无|部分覆盖|没有可比|未关联|无法确认|待.*结算/.test(String(r.统计说明??r.累计统计说明??r.说明??'')));
 return {status:partial?'partial':'success',table:spec.name,rows,filters:{...(key?{[spec.key]:key}:{}),...(date?{[spec.date]:date}:{})},readback:'complete',source:'base_analytics_report',scope:['daily','daily-by-account'].includes(action)?(config.dailyReporting?.mode==='calendar_day'?'北京时间自然日归档；次日快照结算，允许采集时间偏差；'+config.dailyReporting.startDate+'之前保留原采集间隔口径':'采集帖子相邻快照增量'):'发布记录对应帖子的最后采集累计值；发布超过30天停止刷新'};
}
