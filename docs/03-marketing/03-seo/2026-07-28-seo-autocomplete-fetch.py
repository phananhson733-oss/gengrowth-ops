import json,urllib.parse,urllib.request,time,sys
seeds=["why did my website traffic","why is my page not indexed","internal link checker","ai visibility","how to rank in chatgpt","is my website cited by chatgpt","keyword clustering","keyword cannibalization","content decay","free seo audit","site audit tool","sitemap checker","robots txt tester","canonical tag checker","redirect chain checker","hreflang checker","schema markup validator","core web vitals checker","orphan pages","free backlink checker","link gap analysis","unlinked brand mentions","google search console quick wins","my rankings dropped","topical map generator","topic cluster tool","content brief generator","seo report for clients","white label seo report","ai overview tracker","llms.txt","how to get cited by ai","brand prompt tracking","share of voice ai search","seo forecast tool","competitor seo analysis","ai crawler blocked","should i block ai bots","geo optimization tool","answer engine optimization tool","how to check if google indexed my site","seo tool for small business","seo audit report template","why is my traffic down"]
out={}
for s in seeds:
    u="https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q="+urllib.parse.quote(s)
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=10).read().decode("utf-8","ignore")
        out[s]=json.loads(r)[1]
    except Exception as e:
        out[s]=["ERR:"+str(e)]
    time.sleep(0.3)
json.dump(out,open("ac.json","w"),ensure_ascii=False,indent=1)
for k,v in out.items():
    print("###",k)
    for x in v[:10]: print("   -",x)
