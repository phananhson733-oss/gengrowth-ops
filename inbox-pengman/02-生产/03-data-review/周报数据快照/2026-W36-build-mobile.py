from pathlib import Path
import re,html,json
root=Path(__file__).resolve().parents[1]
md=root/'2026-W36-weekly-report.md'
s=md.read_text()
body=re.sub(r'^---\n.*?\n---\n','',s,flags=re.S).strip()
def inline(t):
 t=html.escape(t)
 t=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:'<a href="'+m[2]+'">'+m[1]+'</a>',t)
 t=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',t)
 return re.sub(r'`([^`]+)`',r'<code>\1</code>',t)
def render(lines):
 out=[];i=0
 while i<len(lines):
  l=lines[i].strip()
  if not l:i+=1;continue
  if l.startswith('|'):
   block=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    block.append([x.strip() for x in lines[i].strip().strip('|').split('|')]);i+=1
   headers=block[0]
   for row in block[2:]:
    out.append('<article class="card"><h4>'+inline(row[0])+'</h4><dl>')
    for h,v in zip(headers[1:],row[1:]):out.append('<div><dt>'+inline(h)+'</dt><dd>'+inline(v)+'</dd></div>')
    out.append('</dl></article>')
   continue
  if l.startswith('#'):
   level=len(l)-len(l.lstrip('#'));out.append(f'<h{level}>'+inline(l[level:].strip())+f'</h{level}>');i+=1;continue
  if l.startswith('- ') or re.match(r'^\d+\. ',l):
   out.append('<p class="item">'+inline(l)+'</p>');i+=1;continue
  para=[l];i+=1
  while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','- ')):
   para.append(lines[i].strip());i+=1
  out.append('<p>'+inline(' '.join(para))+'</p>')
 return '\n'.join(out)
parts=re.split(r'^## ',body,flags=re.M)
content=render(parts[0].splitlines())
for idx,part in enumerate(parts[1:]):
 title,_,rest=part.partition('\n')
 if idx==0:content+='<section>'+render(['## '+title]+rest.splitlines())+'</section>'
 else:content+='<details><summary>'+inline(title)+'</summary>'+render(rest.splitlines())+'</details>'
css='''*{box-sizing:border-box}body{margin:0;background:#f2f4f7;color:#182334;font:16px/1.8 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}main{max-width:760px;margin:auto;padding:28px 18px 60px}h1{font-size:27px;line-height:1.4}h2{font-size:22px}h3{font-size:18px;margin-top:30px}h4{margin:0 0 12px;font-size:16px}p{overflow-wrap:anywhere}a{color:#245ac5}code{font-size:.9em;overflow-wrap:anywhere}.card,details{background:white;border:1px solid #dce2ec;border-radius:12px;padding:18px;margin:14px 0}.card{box-shadow:0 3px 10px #15234405}dl{margin:0}dl div{display:grid;grid-template-columns:minmax(90px,40%) 1fr;gap:12px;padding:6px 0;border-bottom:1px solid #edf0f5}dt{color:#667085}dd{margin:0;overflow-wrap:anywhere}summary{font-weight:700;font-size:19px;cursor:pointer}.meta{font-size:13px;color:#667085}.item{padding-left:12px;border-left:3px solid #c7d6f5}strong{color:#113c85}@media(max-width:400px){main{padding:18px 12px}.card,details{padding:13px}h1{font-size:24px}}'''
page='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>彭满周报 · 2026-W36</title><style>'+css+'</style></head><body><main><p class="meta">2026.08.31—09.06 · 09.07 更新 · 团队周报草稿</p>'+content+'<p class="meta">与 Markdown 共享同一正文；详细章节可展开阅读。</p></main></body></html>'
(root/'2026-W36-weekly-report-mobile.html').write_text(page)
# Meaningful arithmetic checks and evidence coverage.
d=json.loads((root/'周报数据快照/2026-W36-source-snapshot.json').read_text())
assert sum(x['sum'] for x in d['summary']['accounts'])==211500
assert sum(x['n'] for x in d['summary']['accounts'])==67
assert sum(x['links'] for x in d['summary']['accounts'])==68
assert round(sum(x['usd'] for x in d['reelshort']['rows']),2)==8.37
assert sum(x['orders'] for x in d['reelshort']['rows'])==4
assert '<!--' not in s and '<table' not in page
for link in re.findall(r'\]\(([^)]+)\)',s):
 if not link.startswith('http'):
  from urllib.parse import unquote
  assert (root/unquote(link)).exists(),link
print('Verified account totals, 67 samples / 68 links, revenue rows, all local links and mobile card layout.')
print('HTML:',root/'2026-W36-weekly-report-mobile.html')
