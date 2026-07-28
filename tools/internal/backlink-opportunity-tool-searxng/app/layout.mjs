export const metadata = { title: '外链机会发现工具', description: 'GenGrowth 内部共享外链机会工具' };

export default function RootLayout({ children }) {
  return <html lang="zh-CN"><body><style>{`
    *{box-sizing:border-box}
    body{margin:0;background:#f5f7f5;color:#1d2720;font:15px/1.5 system-ui,sans-serif}
    .tool{width:min(1200px,calc(100vw - 32px));margin:0 auto;padding:32px 0}
    .tool h1{margin:0}
    .tool header p{color:#647168}
    .tool button,.tool input,.tool select{font:inherit;padding:10px 13px;border-radius:9px;border:1px solid #cfd8d1}
    .tool button{cursor:pointer;background:#246a52;color:white;font-weight:700}
    .tool button:disabled{cursor:wait;opacity:.65}
    .mode-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:24px 0 0}
    .mode-tabs button{min-height:48px;width:100%;font-size:16px}
    .mode-tabs button.active{background:white;color:#246a52;border-color:#246a52;box-shadow:inset 0 0 0 1px #246a52}
    .mode-tabs button:focus-visible{outline:3px solid #9bc5b4;outline-offset:2px}
    .panel,.results{background:white;border:1px solid #d9dfda;padding:20px}
    .panel{display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr) minmax(180px,1fr) auto;gap:12px;align-items:end}
    .panel label{display:grid;gap:6px;color:#647168;font-weight:650}
    .panel input,.panel select,.panel>button{min-height:45px}
    .panel p{grid-column:1/-1;min-height:24px;margin:0;color:#246a52}
    .panel .field-help{min-height:0;color:#7a867e;font-size:12px;font-weight:500;line-height:1.4}
    .results{margin-top:16px}
    .results-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
    .results-head h2{margin:0}
    .table-wrap{overflow:auto}
    table{width:100%;min-width:980px;border-collapse:collapse}
    th,td{padding:10px;border-bottom:1px solid #edf0ee;text-align:left;vertical-align:top}
    th{color:#647168;font-size:12px;white-space:nowrap}
    td{max-width:360px;overflow-wrap:anywhere}
    a{color:#246a52}
    .empty{color:#647168}
    @media (max-width:900px){
      .panel{grid-template-columns:repeat(2,minmax(0,1fr))}
      .panel>button{width:100%}
    }
    @media (max-width:640px){
      .tool{width:min(100% - 20px,1200px);padding:18px 0}
      .panel,.results{padding:15px}
      .panel{grid-template-columns:1fr}
      .panel>button{width:100%;min-height:48px}
    }
  `}</style>{children}</body></html>;
}
