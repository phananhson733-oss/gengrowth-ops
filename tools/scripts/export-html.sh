#!/bin/bash
# Wiki HTML 导出工具
# 用法：./export-html.sh <文件.md> [输出.html]
#
# 生成一个「自包含、可读性强」的单文件 HTML（离线可直接双击打开），特性：
#   - 侧边固定目录（scrollspy 高亮当前章节）
#   - 置信标签自动着色：[High] 绿 / [Medium] 蓝 / [Low] 黄 / [Unverified] 红
#   - 表格斑马纹 + hover 高亮 + 表头吸附 + 超宽横向滚动
#   - blockquote 渲染为卡片式 callout，★ 星级评分染金色
#   - 响应式 + 打印友好（Cmd+P 可直接存 PDF）
#
# 链路：md → 剥 frontmatter（提取 title）→ pandoc(gfm) + 内联 CSS/JS/模板 → 单文件 html
# 依赖：pandoc（brew install pandoc）。CSS/JS 全部内联，无运行时外部依赖。
#
# 输出路径默认与源文件同目录、同名（扩展名改为 .html）。

set -e

if [ -z "$1" ]; then
  echo "用法：$0 <文件.md> [输出.html]"
  exit 1
fi

command -v pandoc >/dev/null 2>&1 || { echo "❌ 未找到 pandoc，请先 brew install pandoc"; exit 1; }

INPUT="$1"
[[ "$INPUT" != /* ]] && INPUT="$(pwd)/$INPUT"
[ -f "$INPUT" ] || { echo "❌ 文件不存在：$INPUT"; exit 1; }

if [ -n "$2" ]; then
  OUTPUT="$2"
  [[ "$OUTPUT" != /* ]] && OUTPUT="$(pwd)/$OUTPUT"
else
  BASENAME=$(basename "$INPUT" .md)
  OUTPUT="$(dirname "$INPUT")/${BASENAME}.html"
fi

# 提取标题：优先 frontmatter title: → 首个 # 标题 → 文件名
TITLE=$(awk '
  NR==1 && /^---[[:space:]]*$/ { in_yaml=1; next }
  in_yaml && /^---[[:space:]]*$/ { in_yaml=0; next }
  in_yaml && /^title:[[:space:]]*/ { sub(/^title:[[:space:]]*/, ""); gsub(/^["'"'"']|["'"'"']$/, ""); print; exit }
' "$INPUT")
if [ -z "$TITLE" ]; then
  TITLE=$(awk '/^#[[:space:]]+/ { sub(/^#[[:space:]]+/, ""); print; exit }' "$INPUT")
fi
[ -z "$TITLE" ] && TITLE=$(basename "$INPUT" .md)

# 临时文件
CLEAN=$(mktemp /tmp/wiki-html-XXXXXX.md)
HEAD=$(mktemp /tmp/wiki-html-head-XXXXXX.html)
FOOT=$(mktemp /tmp/wiki-html-foot-XXXXXX.html)
TPL=$(mktemp /tmp/wiki-html-tpl-XXXXXX.html)
trap "rm -f $CLEAN $HEAD $FOOT $TPL" EXIT

# 预处理：剥离 YAML frontmatter（避免渲染成可见文本）
awk '
  NR==1 && /^---[[:space:]]*$/ { in_yaml=1; next }
  in_yaml && /^---[[:space:]]*$/ { in_yaml=0; next }
  in_yaml { next }
  { print }
' "$INPUT" > "$CLEAN"

# ── 内联 CSS ────────────────────────────────────────────────
cat > "$HEAD" <<'HEAD_EOF'
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{
    --ink:#1f2933; --muted:#647082; --line:#e3e8ef; --bg:#ffffff;
    --accent:#3b5bdb; --accent-soft:#edf0ff; --code-bg:#0f1729;
    --hi:#2b8a3e; --hi-bg:#ebfbee; --med:#1c6fb8; --med-bg:#e7f3ff;
    --low:#b5870b; --low-bg:#fff8e1; --unv:#c0392b; --unv-bg:#fdecea;
    --star:#f59f00;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0; background:#f5f6f8; color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    font-size:16px; line-height:1.75; -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1180px; margin:0 auto; padding:0 24px; display:flex; gap:32px;}
  #TOC{
    position:sticky; top:0; align-self:flex-start; height:100vh; overflow:auto;
    width:268px; flex:0 0 268px; padding:28px 18px 60px 0; font-size:13.5px;
    border-right:1px solid var(--line);
  }
  #TOC::before{content:"目录"; display:block; font-weight:700; font-size:12px; letter-spacing:.12em; color:var(--muted); margin-bottom:12px;}
  #TOC ul{list-style:none; margin:0; padding:0}
  #TOC ul ul{padding-left:14px}
  #TOC li{margin:2px 0}
  #TOC a{color:var(--muted); text-decoration:none; display:block; padding:3px 8px; border-radius:6px; line-height:1.4;}
  #TOC a:hover{background:var(--accent-soft); color:var(--accent)}
  #TOC a.active{background:var(--accent-soft); color:var(--accent); font-weight:600}
  main{flex:1 1 auto; min-width:0; background:var(--bg); margin:28px 0;
    padding:54px 60px 80px; border-radius:14px; box-shadow:0 1px 3px rgba(20,30,50,.06),0 12px 40px rgba(20,30,50,.06);}
  main>h1:first-child{margin-top:0}
  h1{font-size:34px; line-height:1.25; letter-spacing:-.01em; margin:0 0 6px; font-weight:800}
  h2{font-size:25px; margin:54px 0 18px; padding-bottom:10px; border-bottom:2px solid var(--line); font-weight:750}
  h3{font-size:20px; margin:38px 0 14px; font-weight:700}
  h4{font-size:16.5px; margin:26px 0 10px; color:var(--accent); font-weight:700}
  p{margin:12px 0}
  a{color:var(--accent)}
  hr{border:0; border-top:1px solid var(--line); margin:40px 0}
  strong{font-weight:680}
  table{border-collapse:collapse; width:100%; margin:18px 0; font-size:14.5px; display:block; overflow-x:auto;}
  thead th{background:#f0f3fa; color:#33415c; text-align:left; font-weight:700; white-space:nowrap}
  th,td{border:1px solid var(--line); padding:9px 13px; vertical-align:top}
  tbody tr:nth-child(even){background:#fafbfd}
  tbody tr:hover{background:var(--accent-soft)}
  blockquote{
    margin:18px 0; padding:14px 18px; background:var(--accent-soft);
    border-left:4px solid var(--accent); border-radius:0 8px 8px 0; color:#2a3a66;
  }
  blockquote p{margin:6px 0}
  pre{background:var(--code-bg); color:#e7ecf5; padding:18px 20px; border-radius:10px; overflow-x:auto; line-height:1.6; font-size:13.5px;}
  code{font-family:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace}
  :not(pre)>code{background:#eef1f6; color:#b5275b; padding:1.5px 6px; border-radius:5px; font-size:.88em}
  pre code{background:none; color:inherit; padding:0}
  .tag{display:inline-block; font-size:11.5px; font-weight:700; padding:1px 7px; border-radius:999px; line-height:1.6; white-space:nowrap; vertical-align:baseline; margin:0 1px;}
  .tag-high{color:var(--hi); background:var(--hi-bg)}
  .tag-med{color:var(--med); background:var(--med-bg)}
  .tag-low{color:var(--low); background:var(--low-bg)}
  .tag-unv{color:var(--unv); background:var(--unv-bg)}
  .stars{color:var(--star); letter-spacing:1px}
  @media print{ body{background:#fff} main{box-shadow:none;margin:0;padding:0;border-radius:0} #TOC{display:none} .wrap{display:block} }
  @media(max-width:920px){ #TOC{display:none} main{padding:32px 20px} .wrap{padding:0 12px} }
</style>
HEAD_EOF

# ── 内联 JS（运行时着色 + scrollspy）────────────────────────
cat > "$FOOT" <<'FOOT_EOF'
<script>
(function(){
  var rx=/\[(High|Medium|Low|Unverified)\]/;
  function walk(node){
    if(node.nodeType===3){
      if(rx.test(node.nodeValue)){
        var span=document.createElement('span');
        span.innerHTML=node.nodeValue
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/\[High\]/g,'<span class="tag tag-high">High</span>')
          .replace(/\[Medium\]/g,'<span class="tag tag-med">Medium</span>')
          .replace(/\[Low\]/g,'<span class="tag tag-low">Low</span>')
          .replace(/\[Unverified\]/g,'<span class="tag tag-unv">Unverified</span>');
        node.parentNode.replaceChild(span,node);
      }
      return;
    }
    if(node.nodeType===1 && node.tagName!=='SCRIPT' && node.tagName!=='STYLE' && !node.classList.contains('tag')){
      Array.prototype.slice.call(node.childNodes).forEach(walk);
    }
  }
  walk(document.querySelector('main')||document.body);

  document.querySelectorAll('td,li,p').forEach(function(el){
    if(/★/.test(el.innerHTML) && el.children.length<3){
      el.innerHTML=el.innerHTML.replace(/([★☆]{2,})/g,'<span class="stars">$1</span>');
    }
  });

  var toc=document.getElementById('TOC');
  if(toc){
    var links=Array.prototype.slice.call(toc.querySelectorAll('a'));
    var heads=links.map(function(a){return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));});
    function onScroll(){
      var pos=window.scrollY+120, cur=-1;
      heads.forEach(function(h,i){ if(h && h.offsetTop<=pos) cur=i; });
      links.forEach(function(a){a.classList.remove('active');});
      if(cur>=0 && links[cur]) links[cur].classList.add('active');
    }
    window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  }
})();
</script>
FOOT_EOF

# ── 两栏布局模板 ────────────────────────────────────────────
cat > "$TPL" <<'TPL_EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>$title$</title>
$for(header-includes)$
$header-includes$
$endfor$
</head>
<body>
<div class="wrap">
$if(toc)$
<nav id="TOC" role="doc-toc">
$table-of-contents$
</nav>
$endif$
<main>
$body$
</main>
</div>
$for(include-after)$
$include-after$
$endfor$
</body>
</html>
TPL_EOF

# ── 生成 HTML ───────────────────────────────────────────────
pandoc "$CLEAN" \
  --from gfm \
  --to html5 \
  --standalone \
  --toc --toc-depth=3 \
  --template "$TPL" \
  -H "$HEAD" \
  -A "$FOOT" \
  --metadata title="$TITLE" \
  -o "$OUTPUT"

echo "✅ HTML 已生成：$OUTPUT"
