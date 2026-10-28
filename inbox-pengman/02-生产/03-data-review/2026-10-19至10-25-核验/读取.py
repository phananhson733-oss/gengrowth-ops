from pathlib import Path
import json,subprocess,sys
from datetime import datetime
from zoneinfo import ZoneInfo
specs=json.loads(Path('读取配置.json').read_text())
for name,b,tid,fields in specs:
 if name not in sys.argv[1:]:continue
 pages=[]; offset=0; records=[]
 while True:
  output=name+'-'+str(offset)+'.ndjson'
  args=['lark-cli','base','+record-list','--base-token',b,'--table-id',tid,'--as','user','--format','ndjson','--output',output,'--offset',str(offset)]
  for f in fields:args+=['--field-id',f]
  run=subprocess.run(args,capture_output=True,text=True)
  if run.returncode:print(name,run.stdout,run.stderr);sys.exit(1)
  m=json.loads(Path(output.replace('.ndjson','.manifest.json')).read_text())
  pages.append(m);records += [json.loads(l)for l in Path(output).read_text().split('\n') if l.strip()]
  if not m['has_more']:break
  offset=m['next_offset']
 assert len({x['rev']for x in pages})==1, (name,'版本在分页时变化，需重读')
 assert len({x['record_id']for x in records})==len(records)
 Path(name+'.ndjson').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n'for x in records))
 summary={'name':name,'base_token':b,'table_id':tid,'records_count':len(records),'rev':pages[0]['rev'],'timezone':pages[0]['timezone'],'has_more':False,'pages':len(pages),'read_at':datetime.now(ZoneInfo('Asia/Shanghai')).isoformat()}
 Path(name+'.manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps(summary,ensure_ascii=False),flush=True)
