'use client';

import { useState } from 'react';

import { AUTO_REGISTER_HEADERS, toAutoRegisterCsv } from '../src/auto-register-export.mjs';
import { emptyViewStates, exportFilename, pollJob, replaceCompletedView } from './client-logic.mjs';

const JOB_POLL_INTERVAL_MS = 5_000;

async function request(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || '请求失败');
  return body;
}

function statusText(summary) {
  return `已完成：拉取 ${summary.retrieved}、去重 ${summary.deduplicated}、合格 ${summary.qualified}、排除 ${summary.rejected}、可导出 ${summary.created}。`;
}

function ResultTable({ records, view }) {
  if (!records.length) return <p className="empty">尚无{view === 'keyword' ? '关键词机会' : '竞品外链线索'}。</p>;
  return <div className="table-wrap">
    <table>
      <thead><tr>{AUTO_REGISTER_HEADERS.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>{records.map((record, index) => <tr key={`${record.原URL}-${index}`}>
        {AUTO_REGISTER_HEADERS.map((header) => <td key={header}>
          {header === '原URL' && record[header]
            ? <a href={record[header]} target="_blank" rel="noreferrer">{record[header]}</a>
            : record[header]}
        </td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

export default function BacklinkClient() {
  const [view, setView] = useState('keyword');
  const [views, setViews] = useState(emptyViewStates);
  const [targetDomain, setTargetDomain] = useState('');
  const [keyword, setKeyword] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [keywordLimit, setKeywordLimit] = useState('100');
  const [competitorLimit, setCompetitorLimit] = useState('100');
  const current = views[view];

  function updateView(mode, patch) {
    setViews((states) => ({
      ...states,
      [mode]: { ...states[mode], ...patch },
    }));
  }

  async function submit(mode) {
    updateView(mode, { running: true, status: '已提交任务，正在处理…', error: '' });
    try {
      const payload = mode === 'keyword'
        ? { keyword, targetDomain, language: 'en', region: 'us', limit: keywordLimit }
        : { competitorDomain, targetDomain, language: 'en', region: 'us', limit: competitorLimit };
      const created = await request(`/api/discover/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const job = await pollJob({ jobId: created.jobId, fetchJob: async (jobId) => (await request(`/api/jobs/${jobId}`)).job, wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)), pollIntervalMs: JOB_POLL_INTERVAL_MS });
      if (job.status === 'failed') throw new Error(job.error || '任务失败');
      const result = await request(`/api/jobs/${created.jobId}/result`);
      setViews((states) => {
        const completed = replaceCompletedView(states, mode, { records: result.records, summary: job.summary });
        return { ...completed, [mode]: { ...completed[mode], status: statusText(job.summary) } };
      });
      request(`/api/jobs/${created.jobId}/result/ack`, { method: 'POST' }).catch(() => {
        updateView(mode, { status: `${statusText(job.summary)} 临时结果将在 24 小时内自动清理。` });
      });
    } catch (error) {
      updateView(mode, { running: false, error: error.message || '任务失败', status: '' });
    }
  }

  function downloadCsv() {
    const csv = toAutoRegisterCsv(current.records);
    const resultDomain = current.records[0]?.目标域名 || targetDomain;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename({ view, targetDomain: resultDomain });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    updateView(view, { status: `已导出 ${current.records.length} 条到本地。` });
  }

  function switchWithKeyboard(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setView(view === 'keyword' ? 'competitor' : 'keyword');
  }

  return <main className="tool">
    <header>
      <h1>外链机会发现工具</h1>
      <p>每次结果只保留在当前页面；完成后请导出 CSV 到本地。</p>
    </header>
    <nav className="mode-tabs" role="tablist" aria-label="发现模式">
      <button role="tab" aria-selected={view === 'keyword'} className={view === 'keyword' ? 'active' : ''} onClick={() => setView('keyword')} onKeyDown={switchWithKeyboard}>关键词</button>
      <button role="tab" aria-selected={view === 'competitor'} className={view === 'competitor' ? 'active' : ''} onClick={() => setView('competitor')} onKeyDown={switchWithKeyboard}>竞品</button>
    </nav>
    <section className="panel">
      <label className="target-domain-field">
        <span>我方目标域名</span>
        <input
          aria-label="我方目标域名"
          aria-describedby="target-domain-help"
          value={targetDomain}
          onChange={(event) => setTargetDomain(event.target.value)}
          placeholder="例如：gengrowth.ai"
        />
      </label>
      {view === 'keyword' ? <>
        <label>关键词<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="例如：AI writing tools"/></label>
        <label>最多保留结果<select value={keywordLimit} onChange={(event) => setKeywordLimit(event.target.value)}><option>50</option><option>100</option><option>200</option></select></label>
        <button disabled={current.running} onClick={() => submit('keyword')}>{current.running ? '处理中…' : '发现关键词机会'}</button>
      </> : <>
        <label>竞品域名或产品 URL<input value={competitorDomain} onChange={(event) => setCompetitorDomain(event.target.value)} placeholder="例如：astro.com"/></label>
        <label>最多保留线索<select value={competitorLimit} onChange={(event) => setCompetitorLimit(event.target.value)}><option>50</option><option>100</option><option>200</option><option>500</option></select></label>
        <button disabled={current.running} onClick={() => submit('competitor')}>{current.running ? '处理中…' : '发现竞品搜索线索'}</button>
      </>}
      <p id="target-domain-help" className="field-help">“我方目标域名”填写希望获得外链的站点；为客户执行时填写客户域名，不是竞品域名。</p>
      <p role="status">{current.error || current.status}</p>
    </section>
    <section className="results">
      <div className="results-head">
        <h2>{view === 'keyword' ? '关键词机会' : '竞品外链线索'}（{current.records.length}）</h2>
        {current.records.length > 0 && <button onClick={downloadCsv}>导出本次 CSV</button>}
      </div>
      <ResultTable records={current.records} view={view}/>
    </section>
  </main>;
}
