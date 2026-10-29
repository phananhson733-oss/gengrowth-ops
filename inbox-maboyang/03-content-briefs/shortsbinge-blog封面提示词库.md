---
title: ShortsBinge blog 封面提示词库
created: 2026-09-29
生图工具: GPT（ChatGPT 生图 / gpt-image 接口），标题文字由 GPT 直接生成在图上
用法: 滚动文档。每篇新 blog 在"提示词记录"末尾追加一条，不另开文件
---

# ShortsBinge blog 封面提示词库

## 一、封面规格（按站内现有封面整理）

2026-09-29 查看了站内 `/best-short-dramas/` 列表和 My Dragon Husband、Step Back 的封面，现有封面的规格如下：

| 项目 | 规格 |
|---|---|
| 最终尺寸 | **1600 × 900**（16:9），webp |
| 画风 | 电影剧照感的写实数字绘画（cinematic digital painting），不是照片，也不是卡通 |
| 色调 | 偏暗的黄昏 / 夜景，蓝紫为主，局部暖光点缀（灯火、窗光） |
| 构图 | 1–3 个人物，前景是主角，背景交代场景；画面下方是暗色渐变，文字压在上面 |
| 文字 | 底部居中，白色、无衬线、粗体、全大写。可以只有一行大标题（例："MY DRAGON HUSBAND"），也可以大标题加一行小字（例：Step Back 那张） |

## 二、文字写法

每张封面最多两行文字：

| 行 | 内容 | 样式 |
|---|---|---|
| **大标题** | 剧名，或平台类 / 演员类文章的主题 | 白色、粗体、几何无衬线体（类似 Montserrat Bold）、全大写、居中；太长时分两行 |
| **小字（可选）** | 一句不超过 6 个词的钩子，从文章标题里提炼 | 同一字体，字号约为大标题的 1/3，白色或浅金色，放在大标题下方 |

**提示词里的文字写法要点**：
- 要生成的文字一律放在英文双引号里，并加一句 "spelled exactly as written"（严格按原文拼写）。
- 文字以外，明确要求不要出现其他字母、Logo 和水印，防止模型在背景里乱加字。

## 三、用 GPT 出图的流程

GPT 生图没有 16:9 这个比例，横版是 **3:2（1536 × 1024）**。文字在底部，所以**只从顶部裁**：

1. **出图**：
   - ChatGPT：粘贴提示词。
   - 接口：`size` 设为 `1536x1024`。
2. **检查文字**：逐个字母核对拼写。有错就在同一个对话里让它改，例如 "The title is misspelled, it must read exactly 'XXX'"。
3. **裁切**：从**顶部**裁掉 160px，得到 1536 × 864（16:9）。提示词已经要求顶部约 15% 只放背景，裁掉不会伤到人物。
4. **放大并导出**：放大到 1600 × 900，导出为 webp。

## 四、通用提示词骨架

每篇替换【】里的内容：

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights. 【主体：人物、动作、神情】. 【场景与背景】. 【点题的道具或意象】. Use a shallow depth of field and soft rim light on the characters.

Composition: the top 15% of the image contains only background such as sky or ceiling, with no heads or important objects, because it will be cropped off. Place the characters in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "【大标题】" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. 【可选：Directly beneath it, a smaller line reads "【小字】" in the same font at about one third of the size, in soft white.】 The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

## 五、每张封面都要遵守的规则

1. **不画真实演员的长相**：人物一律是虚构形象，提示词里不写任何演员名字。演员片单类文章尤其注意，比如 Maria Barseghian 那篇：封面上可以写她的名字，但不能出现她本人的脸。
2. **不出现平台 Logo 或官方海报元素**：画面和文字里都不写 ReelShort、DramaBox 的名字，也不用它们的 Logo 和配色，也不照抄官方海报的构图。
3. **成人向题材只做暗示**：How to Break a DILF 这类题材，靠距离、眼神、光影表现张力，不出现裸露或亲密动作。
4. **人物设定要和正文一致**：发型、年龄段、服装、场景都以正文和官方简介为准，不给读者制造"封面和剧不一样"的落差。
5. **动画剧的封面也要写实**：Rejecting My Five Female Mates 本身是动画，但封面仍用站内统一的写实画风，保证列表页视觉一致。
6. **不满意就在同一个对话里改**：GPT 支持连续修改，比如"把女主的头发改成棕色""标题再大一点"。比重新生成更容易保持构图不变。
7. **文字生成失败时的兜底**：遇到下面两种情况，就去掉提示词里的 Text 段，出一张无字的图，再到设计工具里加字：
   - 特殊字母（如罗马尼亚语的 Ș）反复写错。
   - GPT 因为片名里的敏感词拒绝生成。
8. **校园题材的人物一律写成成年人**：提示词里明确写 "young adults in their early twenties"，不写 school uniform、plaid skirt、students，也不画肢体冲突、湿身、按倒等动作，用"对峙"代替"打斗"。2026-10-19 Taming My Bullies 初版因为"校服学生 + 按倒 + 湿透"被 GPT 判违规。

---

## 六、提示词记录

### 2026-09-28 · Maria Barseghian Movies: Where to Start With Her 10 Short Dramas

- **大标题**：MARIA BARSEGHIAN
- **小字**：10 SHORT DRAMAS, WHERE TO START
- **构图思路**：演员片单不画演员本人。用"一位女主背影 + 身后几种题材的场景拼接"来表达"她演过很多不同的故事"。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights. A young woman with long dark hair is seen from behind, standing at the center of the frame, so her face is not visible. She looks out at a panoramic backdrop that blends several worlds into one continuous scene: a moonlit forest with a distant wolf silhouette on the left, a candlelit ballroom with a glowing chandelier in the middle, and a city skyline with a lit-up hockey arena on the right. Use a shallow depth of field and soft rim light on her hair and shoulders.

Composition: the top 15% of the image contains only dusk sky, with nothing important in it, because it will be cropped off. Place the woman and the scenes in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "MARIA BARSEGHIAN" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "10 SHORT DRAMAS, WHERE TO START" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-28 · Mireasa șarpelui de argint: de ce o crede Bella pe persoana greșită?（罗马尼亚语）

- **大标题**：MIREASA ȘARPELUI DE ARGINT（两行：MIREASA ȘARPELUI / DE ARGINT）
- **小字**：不加。罗语文字越少，出错的可能越小。
- **⚠️ 特别检查**："Ș"下面必须有逗号形的小尾巴。写错两次以上就按规则 7 改为后期加字。
- **构图思路**：Bella 在林中救下受伤的陌生人，这个人其实是银蛇王 Silvan。画面兼顾"林中初遇"和"银蛇"两个意象，婚纱头纱点题"新娘"。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody twilight lighting in deep blue and violet tones and a few warm accent lights. In a misty forest at dusk, a young woman with long auburn hair and a sheer white bridal veil kneels beside a pale, silver-haired man in a dark cloak who is lying wounded against the roots of an old tree. She presses a cloth to his injured shoulder with a worried expression. A faint silver serpent pattern glows along his forearm, and a silver snake coils in the moss beside them, half hidden in shadow. Fireflies and cold moonlight filter through the trees. Use a shallow depth of field and soft rim light on both characters.

Composition: the top 15% of the image contains only dark tree canopy, with no heads or important objects, because it will be cropped off. Place both characters and the snake in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Romanian and must be spelled exactly, including the special letter "Ș" (S with a comma below). It is set on two lines in large, bold, white, all-caps geometric sans-serif letters. The first line reads "MIREASA ȘARPELUI" and the second line reads "DE ARGINT". The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-29 · Rejecting My Five Female Mates: Why Caine Walks Away From All Five

- **大标题**：REJECTING MY FIVE FEMALE MATES（两行：REJECTING MY / FIVE FEMALE MATES）
- **小字**：HE WALKS AWAY FROM ALL FIVE
- **构图思路**：Caine 背对五姐妹独自离开，是全剧最核心的一幕。五姐妹站在远处，簇拥着一个瘦弱的男人（Seth）。月夜狼族城堡交代背景，脱下的银色铠甲丢在地上，点出"被迫卸甲"这条线。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with a moody moonlit night in deep blue and violet tones and a few warm torch lights. In the foreground, a tall young man with dark hair and a torn, bloodstained shirt walks toward the viewer, away from everyone behind him, with a set jaw and a cold, determined look. Behind him, out of focus on the stone steps of a werewolf pack's castle, five young women in elegant dark gowns stand close together around a slender, pale man who looks fragile and tearful. On the ground near the young man's feet lies a discarded ornate silver armor chestplate engraved with a crescent moon. A full moon hangs over pine forests, with a wolf silhouette on a distant cliff. Use a shallow depth of field and strong rim light on the young man.

Composition: the top 15% of the image contains only night sky and the moon's glow, with no heads or important objects, because it will be cropped off. Place all the characters and the armor in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title is set on two lines in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. The first line reads "REJECTING MY" and the second line reads "FIVE FEMALE MATES". Directly beneath it, a smaller line reads "HE WALKS AWAY FROM ALL FIVE" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-29 · How to Watch ReelShort and DramaBox Dramas for Free (Without the Sketchy Sites)

- **大标题**：WATCH SHORT DRAMAS FOR FREE
- **小字**：THE LEGIT WAYS, NO SKETCHY SITES
- ⚠️ 封面文字里不写 ReelShort、DramaBox，避免用到平台商标。
- **构图思路**：平台问题类文章，不画具体剧情。用"深夜追短剧"的生活场景：手机竖屏里是戏剧化的画面，旁边飘着金币，暗示"免费金币"。风格和剧集封面保持统一。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody late-night lighting in deep blue and violet tones and a warm glow from a phone screen. A young woman is curled up on a sofa under a blanket at night, holding a smartphone vertically, her face lit by the screen and her expression completely captivated. The phone screen shows a dramatic romance scene of a couple standing in the rain, with no text on the screen. A few glowing golden coins float softly in the air around the phone like fireflies, and a cup of tea steams on the side table. Behind her, a rain-streaked window shows blurred city lights. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark wall and window frame, with no heads or important objects, because it will be cropped off. Place the woman, the phone and the coins in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "WATCH SHORT DRAMAS FOR FREE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE LEGIT WAYS, NO SKETCHY SITES" in the same font at about one third of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-29 · How to Break a DILF: The Line Jesse Swore He'd Never Cross

- **大标题**：HOW TO BREAK A DILF
- **小字**：THE LINE HE SWORE HE'D NEVER CROSS
- **⚠️ 兜底方案**：如果 GPT 因为片名里的 "DILF" 拒绝生成，就去掉 Text 段，出一张无字的图，再到设计工具里加字（规则 7）。
- **构图思路**：夜里的 CEO 办公室，男主站在落地窗前，女主（实习生）站在门口，两人之间隔着整个房间。用距离和眼神表现"那条不能越过的线"，完全不出现亲密动作。人物设定按正文：男主快到中年、离过婚、气场强，挽起的袖口下露出纹身；女主 21 岁左右。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and violet tones and warm city lights. A spacious executive office on a high floor at night. On the right, a handsome man in his early forties with short dark hair touched with gray at the temples stands by a floor-to-ceiling window. He wears a tailored charcoal suit, his shirt sleeves rolled up to reveal a dark tattoo on his forearm, and he glances back over his shoulder. On the left, in the open doorway, a young woman in her early twenties in a white blouse and black pencil skirt holds a notebook against her chest and looks at him with determined, unguarded longing. The width of the room separates them, with a single desk lamp casting a warm pool of light between them and the city skyline glittering behind. The mood is tension and restraint: both are fully clothed and elegant, and nothing physical happens between them. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark ceiling and the upper window, with no heads or important objects, because it will be cropped off. Place both characters in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "HOW TO BREAK A DILF" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE LINE HE SWORE HE'D NEVER CROSS" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-30 · Невеста серебряного змея: почему Белла спасла того, кого её учили бояться（俄语）

- **大标题**：НЕВЕСТА СЕРЕБРЯНОГО ЗМЕЯ（两行：НЕВЕСТА / СЕРЕБРЯНОГО ЗМЕЯ）
- **小字**：不加。西里尔字母越少，出错的可能越小。
- **⚠️ 特别检查**：西里尔字母逐个核对，尤其是 Я、Ы、Б、Г 这几个。写错两次以上就按规则 7 改为后期加字。
- **构图思路**：和罗语版是同一部剧，但画面要换一个场景，避免两张封面撞图。罗语版画的是"林中初遇"，这张画第 3 集"被闯入的婚礼"：Bella 穿着婚纱站在乡村婚礼现场，银发的蛇王从暗处现身，地上盘着银蛇的尾巴。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and warm lantern light. A rustic outdoor village wedding at the edge of a dark forest, decorated with lanterns and white flowers. In the center, a young woman with long auburn hair in a simple white wedding dress and veil turns in shock, one hand raised to a faint glowing silver mark on her collarbone. Behind her, stepping out of the forest shadows, a tall, pale man with long silver hair and a dark regal cloak watches her with a possessive, unreadable gaze, and the silver scales of a giant serpent's tail coil across the ground at his feet. Frightened wedding guests pull back in the background. Use a shallow depth of field and cool silver rim light on the man.

Composition: the top 15% of the image contains only dark sky and treetops, with no heads or important objects, because it will be cropped off. Place both characters and the serpent tail in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Russian Cyrillic and must be spelled exactly letter by letter. It is set on two lines in large, bold, white, all-caps geometric sans-serif letters. The first line reads "НЕВЕСТА" and the second line reads "СЕРЕБРЯНОГО ЗМЕЯ". The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-09-30 · Is ReelShort Legit? Is DramaBox Safe? What to Know Before You Pay

- **大标题**：ARE SHORT DRAMA APPS LEGIT?
- **小字**：WHAT TO KNOW BEFORE YOU PAY
- ⚠️ 封面文字里不写 ReelShort、DramaBox，避免用到平台商标。
- **构图思路**：平台问题类文章，风格和"免费看"那张保持一致，但换一个场景：人物在做"付不付钱"的决定。手机上是锁住的剧集和付款确认弹窗（不能出现文字），旁边是信用卡和日历，暗示"订阅自动续费"这个核心风险。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody late-night lighting in deep blue and violet tones and a warm glow from a phone screen. A young woman sits at a kitchen table at night, holding a smartphone and hesitating, her thumb hovering over the screen with a thoughtful, cautious expression. The phone screen shows a blurred dramatic scene behind a glowing padlock icon, with no readable text. On the table beside her lie a credit card, a small desk calendar and a cup of coffee, and a soft warning glow reflects on her face. Behind her, a window shows the dark city. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark wall and window frame, with no heads or important objects, because it will be cropped off. Place the woman, the phone and the credit card in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "ARE SHORT DRAMA APPS LEGIT?" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "WHAT TO KNOW BEFORE YOU PAY" in the same font at about one third of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the phone screen.
```

---

### 2026-10-01 · The Alpha and His Nanny Luna: The Nanny Job That Leads Tiffany Back to Her Daughter

- **大标题**：THE ALPHA AND HIS NANNY LUNA（两行：THE ALPHA AND / HIS NANNY LUNA）
- **小字**：SHE DOESN'T KNOW THE PRINCESS IS HER DAUGHTER
- **构图思路**：保姆 Tiffany 单膝蹲下，和 5 岁的小公主 Maya 平视，小公主紧紧抓着她的手；背后远处，狼王 Asher 站在城堡大厅的台阶上注视着这一幕。小公主的宠物 Gigi 在脚边，呼应"宠物测试"这场关键戏。这部剧是 AI 动画，但封面沿用站内统一的写实画风。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and warm chandelier light. Inside the grand hall of a werewolf royal castle, a young woman with long light-brown hair in a plain, modest dress kneels down to eye level with a five-year-old girl in a small tiara and a pale blue princess dress. The little girl clutches the woman's hand with both of hers and looks up at her with complete trust, while a small fluffy white pet sits at their feet. In the background, on the stone stairs, a tall, broad-shouldered man in an elegant black suit stands with a stern, watchful expression, his eyes faintly glowing gold, watching the two of them. Use a shallow depth of field and soft rim light on the woman and the child.

Composition: the top 15% of the image contains only the dark vaulted ceiling, with no heads or important objects, because it will be cropped off. Place all three characters in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title is set on two lines in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. The first line reads "THE ALPHA AND" and the second line reads "HIS NANNY LUNA". Directly beneath it, a smaller line reads "SHE DOESN'T KNOW THE PRINCESS IS HER DAUGHTER" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-01 · Rhett Wellington Movies and TV Shows: Where to Start With His ReelShort Dramas

- **大标题**：RHETT WELLINGTON
- **小字**：8 SHORT DRAMAS, WHERE TO START
- **构图思路**：演员片单不画演员本人（规则 1）。和 Maria 那张一样用"背影 + 多场景"，但换成男性视角、换成他的题材：一位穿深色西装的男人背影站在中央，左边是纽约黑手党的夜景和老式豪车，中间是月光下的狼族城堡，右边是富豪乡村俱乐部的灯光。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights. A tall man in a tailored dark suit is seen from behind, standing at the center of the frame, so his face is not visible. He looks out at a panoramic backdrop that blends several worlds into one continuous scene: on the left, a rain-slicked New York street at night with a vintage black car and neon reflections; in the middle, a moonlit castle above a pine forest with a distant wolf howling; on the right, the glowing terrace of an exclusive country club with string lights. Use a shallow depth of field and soft rim light on his shoulders.

Composition: the top 15% of the image contains only dusk sky, with nothing important in it, because it will be cropped off. Place the man and the scenes in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "RHETT WELLINGTON" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "8 SHORT DRAMAS, WHERE TO START" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-02 · زوجي السابق التافه هو جني المصباح（阿拉伯语）

- **大标题**：زوجي السابق التافه هو جني المصباح（两行：زوجي السابق التافه / هو جني المصباح）
- **小字**：不加。阿拉伯文从右往左书写、字母要连写，模型最容易出错，文字越少越好。
- **⚠️ 特别检查**：出图后逐字核对，重点看连写是否正确、有没有被写成从左往右。阿拉伯文基本一次写不对，**建议直接按规则 7 出无字图，再后期加字**。
- **构图思路**：和 10/9 那篇英文版（The Great and Powerful Genie）是同一部剧，两张封面要用不同的场景。阿语这张画"生日宴会"这场戏：Christine 穿晚礼服，戴着前任送的钻石项链、背对丈夫；Elijah 浑身湿透、手里握着刚从泳池捞回来的礼物盒站在一旁，手腕上隐约泛着金色的神灯纹路。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and violet tones and warm golden party lights. At a glamorous rooftop birthday party beside a glowing swimming pool, an elegant young woman with sleek blonde hair in a black evening gown wears a sparkling diamond necklace and turns away, laughing with a smug, handsome man in a white suit. A few steps away, a tall dark-haired man in a soaked dress shirt stands alone at the edge of the pool, water dripping from his hair, quietly holding a small wet gift box in his hand. Faint golden patterns resembling the markings of a magic lamp glow softly on his wrist. Party guests in the background whisper and point at him. Use a shallow depth of field and warm rim light on the soaked man.

Composition: the top 15% of the image contains only the dark night sky and string lights, with no heads or important objects, because it will be cropped off. Place all three main characters in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Arabic script, written right to left with correctly connected letters, and must be spelled exactly. It is set on two lines in large, bold, white letters. The first line reads "زوجي السابق التافه" and the second line reads "هو جني المصباح". The text is crisp and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-02 · Best Short Drama Apps in 2026: Which One Fits the Way You Watch?

- **大标题**：BEST SHORT DRAMA APPS
- **小字**：WHICH ONE FITS THE WAY YOU WATCH?
- ⚠️ 封面上不出现任何 App 的名字和图标，也不写 ReelShort、DramaBox、TikTok。
- **构图思路**：盘点类文章，画面要体现"很多选择"：一只手握着手机，手机屏幕上方浮着一排发光的竖屏"剧集卡片"，每张是不同题材的画面（狼人、黑手党、婚礼、城堡），像在挑选。背景是夜晚的卧室。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody late-night lighting in deep blue and violet tones and warm glows from floating screens. A young woman sits cross-legged on her bed at night, holding a smartphone, and above the phone a fan of glowing, floating vertical video cards hovers in the air like a hand of playing cards. Each card shows a different dramatic scene without any text: a wolf howling under a full moon, a man in a dark suit beside a vintage car in the rain, a bride in a white veil, and a castle in the mist. She looks up at them with a curious, choosing expression, one finger reaching toward a card. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark bedroom wall, with no heads or important objects, because it will be cropped off. Place the woman and the floating cards in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "BEST SHORT DRAMA APPS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "WHICH ONE FITS THE WAY YOU WATCH?" in the same font at about one third of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the cards and the phone screen.
```

---

### 2026-10-03 · Betrayed, I Married the Mafia King: A Rosary, a Ring and a Crimson Rose

- **大标题**：BETRAYED, I MARRIED THE MAFIA KING
- **小字**：A ROSARY, A RING AND A CRIMSON ROSE
- **构图思路**：正文围绕三件物品写，封面就画开场那一幕：Ivy 跪坐在冰冷的木地板上哭，手里攥着银色念珠；画面一侧只露出 Don 的一双带疤的大手，递来一朵深红玫瑰，不露脸。原作是动态漫画，画风可以偏插画一点。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and cold grey tones and a single warm pool of light. In a silent stone courtyard at night, a young woman with long auburn hair in a simple pale dress kneels on old wooden floorboards, tear-streaked, clutching a silver rosary in both hands. From the right edge of the frame, a man's large, scarred hands in the dark sleeves of an expensive black suit reach toward her, offering a single flawless crimson rose. Only his hands and forearms are visible; his face stays out of frame in shadow. The rose is the only saturated red in the image. Use a shallow depth of field, with soft light falling on the rose and the rosary.

Composition: the top 15% of the image contains only dark stone wall and shadow, with no heads or important objects, because it will be cropped off. Place the woman, the rosary and the offered rose in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "BETRAYED, I MARRIED THE MAFIA KING" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "A ROSARY, A RING AND A CRIMSON ROSE" in the same font at about one third of the size, in deep crimson red. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-03 · Autumn Noel Movies and TV Shows: Her ReelShort Dramas, Year by Year

- **大标题**：AUTUMN NOEL
- **小字**：HER DRAMAS, YEAR BY YEAR
- ⚠️ 真人演员，**不画她的脸**（规则 2）。封面用"物件时间线"代替人像。
- **构图思路**：正文按年份写（2023 狼人 → 2024 亿万富翁 → 2025 怀孕 → 2026 摇滚乐 The Words），封面就画一条从左到右的"时间线桌面"：满月下的狼形吊坠、一枚婚戒、一双婴儿鞋、一张手写歌词纸和吉他拨片，按顺序摆开，光线从冷蓝过渡到暖金。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody lighting that shifts from cold moonlit blue on the left to warm golden stage light on the right. On a long dark wooden table, a row of objects is arranged from left to right like a timeline: a silver wolf pendant lying in a pool of moonlight, a diamond wedding ring on a folded contract, a tiny pair of white baby shoes, and finally a handwritten sheet of song lyrics with a guitar pick resting on it beside the neck of an electric guitar. Soft autumn leaves in orange and red are scattered along the table between the objects. No people appear in the image. Use a shallow depth of field, with each object catching its own rim light.

Composition: the top 15% of the image contains only the dark background, with no important objects, because it will be cropped off. Place the row of objects across the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "AUTUMN NOEL" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "HER DRAMAS, YEAR BY YEAR" in the same font at about one third of the size, in warm autumn orange. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the lyric sheet and the contract, which show only illegible scribbles.
```

---

### 2026-10-04 · Erwachen des Alphas: Warum das Rudel über Nory zu früh lacht（德语）

- **大标题**：ERWACHEN DES ALPHAS
- **小字**：DIE RÜCKKEHR DES WOLFSKÖNIGS
- ⚠️ 德语变音字母 Ü、Ö 出图后逐字核对；写错就按规则 7 出无字图后期加字。
- **构图思路**：正文主线是"被嘲笑的人砸碎试炼石"。画竞技场中央：一个穿破旧斗篷的年轻男人一掌击碎发光的巨大石碑，碎石飞溅；看台上的狼人族人目瞪口呆；背后淡淡浮现一头金色巨狼的虚影。原作是动态漫画，画风可偏动漫插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a slightly anime-inspired finish, moody dusk lighting in deep blue and steel grey with a burst of warm gold at the center. In the middle of an ancient stone arena, a lean young man with shaggy dark hair in a worn, hooded traveller's cloak strikes a huge glowing testing stone with one open palm, and the stone shatters outward in a spray of golden light and flying fragments. Behind him, the faint translucent silhouette of an enormous golden wolf rises like a spirit. In the stands around the arena, a crowd of rugged pack warriors in leather and fur stare in shock, and a proud young man in fine silver-trimmed clothes grips the railing, stunned. Use a shallow depth of field, with dust and sparks hanging in the air.

Composition: the top 15% of the image contains only dusk sky and the far rim of the arena, with no heads or important objects, because it will be cropped off. Place the young man, the shattering stone and the wolf spirit in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "ERWACHEN DES ALPHAS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "DIE RÜCKKEHR DES WOLFSKÖNIGS" in the same font at about one third of the size, in warm gold, with the umlauts on Ü and Ö clearly shown. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-04 · Werewolf Short Dramas: A Field Guide to the Tropes, and Where to Start

- **大标题**：WEREWOLF SHORT DRAMAS
- **小字**：A FIELD GUIDE TO THE TROPES
- **构图思路**：类型总攻略，不画某一部剧的具体角色。画一幅"月下狼群"的类型海报：满月下的森林悬崖，一头巨大的银狼仰头嗥叫；前景是一对背影（女生披着红斗篷，男生穿深色长大衣）并肩望月，暗示"命定伴侣"这一核心设定。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and silver tones. A huge full moon hangs low over a misty pine forest. On a rocky cliff at the center, an enormous silver wolf throws its head back and howls, its fur glowing in the moonlight, and faint shapes of other wolves stand among the trees below. In the foreground, seen from behind, a young woman in a flowing red cloak and a tall man in a long dark coat stand side by side on the edge of the cliff, looking up at the moon, their hands almost touching. The red cloak is the only warm colour in the image. Use a shallow depth of field, with drifting mist and moonlight catching the edges of the figures.

Composition: the top 15% of the image contains only dark night sky, with no important objects, because it will be cropped off. Keep the full moon, the howling wolf and the couple in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "WEREWOLF SHORT DRAMAS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "A FIELD GUIDE TO THE TROPES" in the same font at about one third of the size, in pale moonlight silver. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-05 · DramaBox Review 2026: What It Really Costs, and What Users Complain About

- **大标题**：WHAT IT REALLY COSTS
- **小字**：A SHORT DRAMA APP REVIEW, 2026
- ⚠️ 按规则封面不出现平台名，所以大标题**不写 DRAMABOX**，改用文章副标题的核心句。如果要让封面和标题完全对应，可以后期自己加 "DRAMABOX REVIEW" 字样，但图里别让模型画出 DramaBox 的 logo。
- **构图思路**：正文核心是"周卡越用越贵"。画深夜床上的人拿着手机，手机屏幕只有一片发光的竖屏剧画面（无文字）；旁边床头柜上一张长长的收据纸从桌面垂到地上，暗示每周自动续费越堆越多。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody late-night lighting in deep blue and violet tones and a warm glow from a phone screen. A young woman lies on her bed at night, absorbed in a vertical drama playing on her smartphone, the screen showing only a glowing romantic scene with no text. On the bedside table next to her, a very long paper receipt curls off the edge of the table and spills in loose loops all the way down to the floor, lit by a soft lamp, suggesting charges that keep piling up while she watches. A few gold coins are scattered beside the receipt. Use a shallow depth of field, with the receipt and the phone as the two points of light.

Composition: the top 15% of the image contains only the dark bedroom wall, with no heads or important objects, because it will be cropped off. Place the woman, the phone and the spilling receipt in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "WHAT IT REALLY COSTS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "A SHORT DRAMA APP REVIEW, 2026" in the same font at about one third of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the receipt and the phone screen, which show only illegible marks.
```

---

### 2026-10-05 · My Boss Is My Secret Online Dom: Cake, Master, and the Director Who Figures It Out First

- **大标题**：MY BOSS IS MY SECRET ONLINE DOM
- **小字**：CAKE, MASTER, AND THE DIRECTOR
- ⚠️ 剧本身是 Adults Only，封面**只做暗示**：不画裸露、不画道具，只用"面具 + 手机屏幕 + 医院"来交代双重身份。"DOM" 一词如果 GPT 拒绝出字，按规则 7 出无字图后期加字。
- **构图思路**：左右分屏式构图。左半边是白天冷光的医院走廊：穿白大褂、表情冷硬的男上司俯视一个抱着病历夹、低头的年轻护士；右半边是夜晚暖红光的卧室：同一个护士坐在床边捧着手机，屏幕上只有一个戴黑色面具的男人剪影。两边中间用一道模糊的光带分开。原作是 AI 动画，画风可偏精致插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish. The image is split into two halves by a soft vertical band of blurred light. On the left, in a cold blue-white hospital corridor by day, a tall, stern man in a sharp dark suit under a white doctor's coat looks down coolly at a young nurse with a low ponytail in pale blue scrubs, who hugs a clipboard to her chest and keeps her eyes lowered. On the right, in a dim bedroom by night lit in warm crimson and amber, the same young nurse, now in an oversized sweater, sits on the edge of her bed holding her phone close with a soft, trusting smile; the phone screen shows only the dark silhouette of a man wearing a sleek black half-mask. The mood is tense and intimate but fully clothed and tasteful. Use a shallow depth of field.

Composition: the top 15% of the image contains only the corridor ceiling on the left and the dark bedroom wall on the right, with no heads or important objects, because it will be cropped off. Place both scenes and all figures in the middle band of the frame. The bottom third fades into a dark gradient across both halves.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "MY BOSS IS MY SECRET ONLINE DOM" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "CAKE, MASTER, AND THE DIRECTOR" in the same font at about one third of the size, in deep crimson. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the clipboard and the phone screen.
```

---

### 2026-10-06 · O Doutor Que Marcou Meu Destino: a versão brasileira de um sucesso do ReelShort, explicada（葡语）

- **大标题**：O DOUTOR QUE MARCOU MEU DESTINO
- **小字**：A VERSÃO BRASILEIRA, EXPLICADA
- ⚠️ 真人剧（Mharessa、Miguel Coelho），**不画演员的脸**，人物用泛化形象。葡语 Ã 的波浪号出图后要核对，写错就按规则 7 后期加字。
- **构图思路**：正文的关键场景是"雨夜她拍车窗求救"和"第一天报到发现上司就是他"。封面画前者：雨夜街头，一个年轻女人手掌贴在一辆黑色豪车的车窗上，车内隐约是一个穿深色西装的男人侧影；车窗倒影里叠着医院走廊的冷光，暗示后面的职场重逢。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody rainy-night lighting in deep blue and teal tones and warm amber from streetlights. On a deserted city street in the rain, a frightened young woman with long wavy dark hair, soaked and wearing a thin white blouse, presses one palm against the rain-streaked window of a sleek black luxury car, looking in with desperate eyes. Inside the car, half in shadow, a composed dark-haired man in a tailored dark suit turns his head toward her. In the reflection on the wet car window, the faint cold-lit image of a modern hospital corridor is layered over the scene, like a glimpse of their future. Use a shallow depth of field, with raindrops catching the light.

Composition: the top 15% of the image contains only dark rainy sky and blurred streetlights, with no heads or important objects, because it will be cropped off. Place the woman, the car window and the man inside in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "O DOUTOR QUE MARCOU MEU DESTINO" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "A VERSÃO BRASILEIRA, EXPLICADA" in the same font at about one third of the size, in warm amber, with the tilde on Ã clearly shown. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-06 · Jesse Morales Movies and TV Shows: The Silver Fox, the Billionaire and the Husband You'll Hate

- **大标题**：JESSE MORALES
- **小字**：THE SILVER FOX, THE BILLIONAIRE AND THE HUSBAND YOU'LL HATE
- ⚠️ 真人演员，**不画他的脸**（规则 2）。和 Autumn Noel 那张一样用"物件"代替人像，但换构图：不做一字排开的时间线，改成三格并排的"角色道具"。
- **构图思路**：正文按他演的三类男人组织。画面做成三块并排的暗色展台，各放一件代表物：左边一副金丝眼镜压在一本大学教科书上（教授/银狐），中间一枚钻石婚戒压在一份合同上（契约亿万富翁），右边一顶烧焦的消防头盔（让人恨的前夫）。光从左暖到右冷。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody lighting that shifts from warm amber on the left to cold smoky blue on the right. Three dark stone plinths stand side by side like a gallery display, each lit by its own spotlight. On the left plinth, a pair of elegant gold-rimmed glasses rests on a closed leather-bound university textbook beside a glass of whiskey. On the middle plinth, a large diamond wedding ring sits on a folded contract with a black fountain pen. On the right plinth, a scorched, soot-covered firefighter's helmet sits in drifting smoke with faint embers glowing around it. No people appear in the image. Use a shallow depth of field, with dust motes in the light beams.

Composition: the top 15% of the image contains only the dark background, with no important objects, because it will be cropped off. Place the three plinths and their objects across the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "JESSE MORALES" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE SILVER FOX, THE BILLIONAIRE AND THE HUSBAND YOU'LL HATE" in the same font at about one quarter of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the textbook and the contract, which show only illegible marks.
```

---

### 2026-10-07 · Accidentally His: The Dragon King Won't Let Go, Explained

- **大标题**：ACCIDENTALLY HIS
- **小字**：THE DRAGON KING WON'T LET GO
- **构图思路**：正文主线是"一夜之后一天就生出一个五岁的龙族孩子"。画一个穿粗布长裙的年轻母亲把一个小男孩护在身后，男孩手臂和脸颊上有淡淡的金色鳞纹、额头冒出一对小角；远处宫殿台阶上，一个披深色长袍、身后隐约有巨龙影子的男人正看向他们。原作是 AI 动画，画风可偏奇幻插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly fantasy illustration, with moody twilight lighting in deep blue and violet tones and warm gold from lanterns. In a stone courtyard at dusk, a young woman with long chestnut hair in a simple, worn peasant dress kneels protectively in front of a small boy of about five, one arm shielding him. The boy has faint golden scale patterns on his cheek and forearm and two tiny curved horns on his forehead, and he looks out bravely. Further back, at the top of a grand palace staircase, a tall, commanding dark-haired man in a flowing black robe with gold embroidery stares down at them, and behind him the enormous translucent shadow of a dragon spreads its wings across the palace wall. A deep red Blood Moon hangs low in the sky. Use a shallow depth of field.

Composition: the top 15% of the image contains only sky and the Blood Moon's glow, with no heads or important objects, because it will be cropped off. Place the mother and boy in the lower middle of the frame and the man with the dragon shadow in the upper middle. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "ACCIDENTALLY HIS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE DRAGON KING WON'T LET GO" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-07 · How to Cancel a ReelShort Subscription (and Stop the Charges for Good)

- **大标题**：HOW TO CANCEL YOUR SUBSCRIPTION
- **小字**：AND STOP THE CHARGES FOR GOOD
- ⚠️ 按规则封面不出现平台名，大标题不写 REELSHORT。需要的话后期加字。
- **构图思路**：和 10/5 DramaBox 测评那张（床头柜上垂到地上的收据）区分开。这张画"剪断"：一只手拿着剪刀剪断一条由发光小金币串成的链子，链子另一端连着一部亮着的手机（屏幕无字），断口处金币散落。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody lighting in deep blue and teal tones and warm gold highlights. On a dark wooden desk at night, a smartphone lies glowing with a blank, softly lit screen. From the phone, a long chain made of small glowing gold coins runs across the desk and off toward the edge, like a leash. A hand holding a pair of silver scissors is cutting the chain in the middle, and at the cut, a few gold coins break loose and tumble through the air, catching the light. The mood is one of relief and taking back control. Use a shallow depth of field, with the scissors and the breaking chain in sharp focus.

Composition: the top 15% of the image contains only the dark background, with no important objects, because it will be cropped off. Place the phone, the coin chain and the scissors across the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "HOW TO CANCEL YOUR SUBSCRIPTION" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "AND STOP THE CHARGES FOR GOOD" in the same font at about one third of the size, in soft teal. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the phone screen.
```

---

### 2026-10-08 · Le Grand et Puissant Génie : qui sait qu'Elijah est un génie（法语）

- **大标题**：LE GRAND ET PUISSANT GÉNIE
- **小字**：QUI CONNAÎT SON SECRET ?
- ⚠️ 法语 É、Î 的重音符出图后核对；写错就按规则 7 后期加字。
- ⚠️ 同一部剧已有 10/2 阿语封面（生日泳池派对），10/9 英文版还会再出一张。这张画第三个场景：**开篇的"渔夫钓起神灯"**，三张图不重复。
- **构图思路**：黄昏海边的旧木码头，一个穿破旧衣服的年轻渔夫惊讶地看着渔网里捞起的金色神灯；神灯里升起一缕金色烟雾，烟雾中隐约是一个高大男人的轮廓（不画清晰五官）。远处海平线上叠着一座现代摩天大楼的淡影，暗示这盏灯将带来的财富。原作是动态漫画，画风可偏插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a slightly illustrated finish, warm golden-hour lighting fading into deep blue dusk. On an old wooden fishing pier by the sea, a poor young fisherman in a patched shirt and rolled-up trousers stares in astonishment at his dripping fishing net, where an ornate golden oil lamp lies tangled among the ropes instead of fish. A swirl of glowing golden smoke pours from the lamp's spout and rises into the shape of a tall, broad-shouldered man, only an elegant silhouette made of light with no detailed face. Far away on the horizon, the faint translucent outline of a modern skyscraper skyline glows over the water, like a vision of the fortune to come. Use a shallow depth of field, with sparkles of light in the smoke.

Composition: the top 15% of the image contains only the dusk sky, with no heads or important objects, because it will be cropped off. Place the fisherman, the lamp and the smoke figure in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "LE GRAND ET PUISSANT GÉNIE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written with the accent on É, on two lines if needed. Directly beneath it, a smaller line reads "QUI CONNAÎT SON SECRET ?" in the same font at about one third of the size, in warm gold, with the circumflex on Î clearly shown. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-08 · Billionaire and CEO Short Dramas: A Guide to the Genre's Favorite Secrets

- **大标题**：BILLIONAIRE SHORT DRAMAS
- **小字**：A GUIDE TO THE GENRE'S FAVORITE SECRETS
- **构图思路**：类型总攻略，不画具体某部剧。正文主线是"每部亿万富翁剧都藏着一个秘密"，画面用"面具"表达：顶层公寓落地窗前，一个穿高定西装的男人背对镜头俯瞰夜景城市，手里垂着一张摘下的普通工人安全帽；玻璃倒影里是一个穿晚礼服、手拿一张婚约合同的女人。冷蓝夜景 + 金色室内光。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep navy blue and warm gold from interior lamps. In a luxurious penthouse at night, a tall man in an impeccably tailored black suit stands with his back to the viewer before a floor-to-ceiling window, looking out over a glittering city skyline. In his lowered hand he loosely holds a dusty yellow construction worker's hard hat, as if he has just taken off a disguise. In the reflection on the dark window glass, a young woman in an elegant champagne evening gown is faintly visible behind him, holding a folded contract to her chest and watching him. Use a shallow depth of field, with soft bokeh from the city lights.

Composition: the top 15% of the image contains only dark night sky above the skyline, with no heads or important objects, because it will be cropped off. Place the man, the hard hat and the woman's reflection in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "BILLIONAIRE SHORT DRAMAS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "A GUIDE TO THE GENRE'S FAVORITE SECRETS" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the contract, which shows only illegible marks.
```

---

### 2026-10-09 · The Great and Powerful Genie: The Full Story, Ruby Hiller, and How It Ends

- **大标题**：THE GREAT AND POWERFUL GENIE
- **小字**：THE FULL STORY, AND HOW IT ENDS
- ⚠️ 同一部剧第三张封面：10/2 阿语画生日泳池派对，10/8 法语画渔夫捞起神灯。这张画**结局**：权贵聚会上真相揭开，Elijah 牵起 Ruby 的手离开，Christine 在身后落泪。不出现任何文字道具。
- **构图思路**：金色宴会厅，前景右侧一位穿深色西装、手腕上隐约有金色神灯纹路的高大男人，牵着一位穿简洁白裙、气质温柔的年轻女子（Ruby）朝光亮处走去；画面左侧后景，一个穿红色晚礼服的金发女人（Christine）伸手想留住他，满脸悔意。宾客在两侧注视，头顶水晶吊灯。原作是 AI 动画，画风可偏精致插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, warm golden ballroom lighting against deep shadow. In a grand ballroom full of powerful guests in evening wear, a tall, handsome dark-haired man in a dark tailored suit walks toward a bright doorway on the right, holding the hand of a graceful young woman with soft brown hair in a simple, elegant white dress, who looks up at him with quiet affection. Faint glowing golden patterns, like the markings of a magic lamp, shimmer on his wrist. On the left, a little further back, a glamorous blonde woman in a striking red evening gown reaches out a hand toward him with tears in her eyes and an expression of deep regret. Crystal chandeliers glow overhead, and the surrounding guests turn to watch in silence. Use a shallow depth of field.

Composition: the top 15% of the image contains only the ballroom ceiling and chandelier glow, with no heads or important objects, because it will be cropped off. Place the walking couple and the regretful woman in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "THE GREAT AND POWERFUL GENIE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "THE FULL STORY, AND HOW IT ENDS" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-09 · Chris Quartuccio Movies and TV Shows: Your Questions About the Quarterback Next Door, Answered

- **大标题**：CHRIS QUARTUCCIO
- **小字**：THE QUARTERBACK NEXT DOOR, AND MORE
- ⚠️ 真人演员，**不画他的脸**（规则 2）。前几位演员封面用过"物件时间线"（Autumn Noel）和"三座展台"（Jesse Morales），这张换成**场景**：没有人物的空间。
- **构图思路**：他的标志角色是校园运动型男主。画夜晚的高中/大学橄榄球场看台：灯光球场照亮绿茵场，看台第一排放着一件挂着的 8 号球衣、一个橄榄球头盔、一根冰球杆靠在旁边；远处是一排郊区住宅，其中一扇二楼窗户亮着暖光（"隔壁的男孩"）。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and emerald tones and warm golden stadium floodlights. An empty American high-school football field glows under the floodlights at night. In the foreground, on the front row of the bleachers, a football jersey hangs over the railing next to a scuffed football helmet resting on the bench, with a hockey stick leaning against the seat beside them. Beyond the field, a row of quiet suburban houses sits under the night sky, and one upstairs window in the nearest house glows with warm yellow light, as if someone next door is still awake. No people appear in the image. Use a shallow depth of field, with soft haze in the floodlight beams.

Composition: the top 15% of the image contains only the dark night sky and the tops of the floodlight towers, with no important objects, because it will be cropped off. Place the jersey, helmet, hockey stick and the glowing window in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "CHRIS QUARTUCCIO" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE QUARTERBACK NEXT DOOR, AND MORE" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the jersey, which shows no number or name.
```

---

### 2026-10-10 · Великият и могъщ джин: има ли бг аудио, колко са епизодите и коя версия да гледате（保加利亚语）

- **大标题**：ВЕЛИКИЯТ И МОГЪЩ ДЖИН
- **小字**：БГ АУДИО, ЕПИЗОДИ И ДВЕТЕ ВЕРСИИ
- ⚠️ 西里尔字母：出图后逐字核对（Ъ、Щ、Ж 最容易写错）。写错就按规则 7 出无字图后期加字。
- ⚠️ 同一部剧第四张封面（阿语=泳池派对，法语=渔夫捞神灯，英文=结局舞会）。这张画正文独有的**"两个版本"**：一面镜子两侧，左边是动画风格的 Elijah，右边是写实风格的同一个人，各自手里托着同一盏神灯。
- **构图思路**：古董镜框把画面一分为二。镜子外（左）是精致插画/动画质感的年轻男人手托金色神灯；镜子里（右）是同一个人的写实电影质感版本，同样托着神灯。两侧光线一暖一冷。不画真实演员的脸，写实那一侧只做泛化人物。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art, with moody lighting in deep blue and violet tones and warm gold. An ornate antique gold-framed mirror stands in the center of a dim, luxurious room and splits the image into two halves. On the left, outside the mirror, a handsome dark-haired young man in a dark suit is rendered in a polished, stylized animated illustration style, holding a glowing golden magic lamp in his open palm. On the right, inside the mirror's reflection, the same man appears in a photorealistic cinematic style, a generic face with no resemblance to any real person, holding the same glowing lamp. Golden smoke curls from both lamps and meets at the mirror's edge. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark ceiling and the top of the mirror frame, with no heads or important objects, because it will be cropped off. Place both versions of the man and the lamps in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Bulgarian Cyrillic and must be spelled exactly. The main title reads "ВЕЛИКИЯТ И МОГЪЩ ДЖИН" in large, bold, white, all-caps geometric sans-serif letters. Directly beneath it, a smaller line reads "БГ АУДИО, ЕПИЗОДИ И ДВЕТЕ ВЕРСИИ" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-10 · How to Cancel a DramaBox Subscription: iPhone, Android, Website and Guest Accounts

- **大标题**：HOW TO CANCEL YOUR MEMBERSHIP
- **小字**：IPHONE, ANDROID, WEBSITE AND GUEST ACCOUNTS
- ⚠️ 按规则封面不出现平台名，大标题不写 DRAMABOX，需要的话后期加字。
- ⚠️ 和 10/7 ReelShort 退订封面（剪刀剪断金币链）区分开：这张画**日历上每周被圈出的扣费日**。
- **构图思路**：书桌上摊着一本月历，每周同一天都被红笔圈出，旁边一张银行卡；一只手拿着笔，正在把下一个圈划掉。旁边亮着的手机屏幕上只有一个绿色的对勾图标（无字）。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody evening lighting in deep blue and warm amber from a desk lamp. On a wooden desk, an open paper wall calendar lies flat, and the same day of every week is circled in red ink, row after row, like a pattern of recurring charges. A bank card rests beside the calendar. A hand holding a black pen is crossing out the next red circle with a firm stroke. Next to it, a smartphone glows with a blank screen showing only a simple green checkmark icon. The mood is one of relief and regaining control. Use a shallow depth of field, with the pen stroke and the circles in sharp focus.

Composition: the top 15% of the image contains only the dark background, with no important objects, because it will be cropped off. Place the calendar, the hand, the card and the phone across the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "HOW TO CANCEL YOUR MEMBERSHIP" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "IPHONE, ANDROID, WEBSITE AND GUEST ACCOUNTS" in the same font at about one third of the size, in soft amber. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the calendar, which shows only circles and lines, and on the bank card.
```

---

### 2026-10-12 · From Page to King Arthur: What This Short Drama Keeps from the Legend（计划外加写）

- **大标题**：FROM PAGE TO KING ARTHUR
- **小字**：THE LEGEND, REWRITTEN
- **构图思路**：正文核心是"最底层的侍童 → 拔出王者之剑"。画城堡兵器库里：一个穿朴素侍童服、抱着一摞擦好的盔甲的年轻人，抬头望向墙上一把被光照亮的长剑；他身后的石墙上投下一个戴王冠、披斗篷的高大影子（暗示真实身份）。窗外远处天空有一条龙的剪影。原作是 AI 动画，画风可偏奇幻插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly fantasy illustration with moody lighting in deep blue and steel grey and a single beam of warm golden light. Inside a medieval castle armory, a lean young man in a plain servant's tunic stands holding a stack of freshly polished armor pieces in his arms, looking up at a magnificent longsword mounted on the stone wall, which glows in a shaft of golden light from a high window. Behind him, cast on the stone wall by the light, his shadow takes the shape of a tall king wearing a crown and a flowing cloak. Through the narrow window, far in the stormy sky, the dark silhouette of a dragon circles above distant hills. Use a shallow depth of field, with dust motes floating in the light beam.

Composition: the top 15% of the image contains only the dark vaulted ceiling, with no heads or important objects, because it will be cropped off. Place the young man, the glowing sword and the crowned shadow in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "FROM PAGE TO KING ARTHUR" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE LEGEND, REWRITTEN" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-12 · No One Choose Me: The Antidote, the Rebirth, and Why the Son's Choice Hurts Most（计划外加写）

- **大标题**：NO ONE CHOOSE ME
- **小字**：THE ANTIDOTE, THE REBIRTH, THE REVENGE
- ⚠️ 剧名本身语法不通（choose 不是 chooses），这是官方剧名，**照原样拼写**，不要让模型"纠正"成 CHOSE/CHOOSES。
- **构图思路**：正文核心是"唯一的解药给了别人"。古希腊神殿大厅里，一只小小的金色解药瓶被一个穿华丽长袍的男人和一个卷发小男孩一起递向画面右侧另一位穿深色长裙的女人；画面左侧前景，穿白色希腊长裙、戴珍珠发饰的金发女子（Veya）倒在大理石台阶旁，伸着手却够不到。背景神殿立柱、暖橙暮色。人物用泛化形象，不复刻海报上的具体脸。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with rich, moody golden-hour light against deep shadow, set in an ancient Greek temple hall with tall marble columns. On the right, a handsome bearded man in a white and gold Greek chiton and a small curly-haired boy in a rich brown tunic together hand a tiny glowing golden vial to a dark-haired woman in a sleek black and gold gown, who reaches for it with a faint smile. In the left foreground, a pale blonde woman in a flowing white Greek gown with a pearl headpiece has collapsed against the marble steps, one hand stretched toward the vial she cannot reach, her eyes full of disbelief. A single shaft of light falls on her outstretched hand. Use a shallow depth of field.

Composition: the top 15% of the image contains only the temple ceiling and column tops, with no heads or important objects, because it will be cropped off. Place all four figures and the vial in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "NO ONE CHOOSE ME" in large, bold, white, all-caps classical serif letters, spelled exactly as written, including the word CHOOSE exactly as shown. Directly beneath it, a smaller line reads "THE ANTIDOTE, THE REBIRTH, THE REVENGE" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-11 · I Rule the Wasteland Harem: Wade Ryder, the Ring System, and Three Very Different Wives

- **大标题**：I RULE THE WASTELAND HAREM
- **小字**：THE RING, THE RIFLE AND THREE WIVES
- ⚠️ 剧本身有拍卖女性、未遂性侵情节，封面**只画"末世+系统"**，女性角色全部正常着装、姿态自信，不画任何受害场景。
- **构图思路**：末日废土的黄昏，一个穿破旧夹克的年轻男人站在废墟高处，一手握步枪，另一只手上的戒指投射出发光的蓝色全息"任务面板"（只有图形无文字）；他身后并排站着三位风格不同的女性：一位优雅短发（前富家女）、一位利落长发（姐姐）、一位明艳金发（前好莱坞女星）。原作是 AI 动画，画风可偏动漫插画。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with an anime-inspired finish, dusty orange post-apocalyptic sunset light with cool cyan glows. On top of a heap of ruined concrete and rusted cars in a wasteland city, a lean young man in a battered leather jacket stands confidently, holding a rifle at his side. A ring on his other hand projects a glowing blue holographic panel of abstract game-like icons and progress bars, with no readable text. Behind him stand three confident young women in practical, fully clothed survival outfits: one with an elegant dark bob, one with a long ponytail and a sharp gaze, and one glamorous blonde with movie-star poise. Distant collapsed skyscrapers and drifting dust fill the background. Use a shallow depth of field.

Composition: the top 15% of the image contains only the hazy sky, with no heads or important objects, because it will be cropped off. Place the young man, the hologram and the three women in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "I RULE THE WASTELAND HAREM" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "THE RING, THE RIFLE AND THREE WIVES" in the same font at about one third of the size, in glowing cyan. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the hologram.
```

---

### 2026-10-11 · Cooking My Way Out of Servitude: A Master Chef, a Ruined Banquet, and the Road to the Golden Key

- **大标题**：COOKING MY WAY OUT OF SERVITUDE
- **小字**：FROM KITCHEN HAND TO MASTER CHEF
- **构图思路**：第一集开场就是"宴会一小时后开始"的厨房危机。画古代东方风格的大厨房：灶火熊熊，一个穿朴素粗布衣、袖子挽起的年轻厨工站在案板前，正把一盘精致的菜（莲藕片、卷心菜卷、整只红蟹摆盘）推出去；身后几个穿深红厨服的厨师目瞪口呆；远处门口一位衣着华贵的贵妇（侯爵夫人）停下脚步注视。墙上隐约挂着一把金色钥匙（Golden Key）。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with rich, warm firelight and deep shadow, in a grand historical East Asian-style manor kitchen with wooden beams and steaming stoves. A young kitchen hand in a plain rough-spun tunic with rolled-up sleeves stands at a wooden worktable, calmly presenting an exquisite plated dish: delicate slices of lotus root, neat cabbage rolls and a whole bright red crab arranged like a work of art. Behind him, several older cooks in deep red aprons stare in shock. In the doorway in the background, an elegantly dressed noblewoman in silk robes has stopped to watch with interest. On the wall above, a small ornate golden key hangs in a beam of light. Use a shallow depth of field, with steam and sparks in the air.

Composition: the top 15% of the image contains only the dark kitchen beams, with no heads or important objects, because it will be cropped off. Place the young cook, the dish, the shocked cooks and the noblewoman in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "COOKING MY WAY OUT OF SERVITUDE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "FROM KITCHEN HAND TO MASTER CHEF" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-12 · In Bed with My Brother-in-Law: The Gotti Pact, Two Brothers, and Bella's Three-Day Deadline

- **大标题**：IN BED WITH MY BROTHER-IN-LAW
- **小字**：THE GOTTI PACT. TWO BROTHERS. THREE DAYS.
- ⚠️ 成人题材只做暗示：不画床戏，用"婚纱+两兄弟"交代禁忌三角。
- **构图思路**：教堂空荡的婚礼现场，穿婚纱的 Bella 站在圣坛前独自一人；画面左侧远处门口是穿白西装、搂着另一个女人的未婚夫背影；右侧前景阴影里，一个穿黑色三件套、气场强大的男人（Damian）靠着立柱看着她，手里把玩一张黑卡。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, moody lighting in deep navy and wine red with warm candlelight. Inside an empty, ornate church after a wedding has fallen apart, a beautiful young bride with dark wavy hair in an elegant white wedding gown stands alone before the altar, holding a wilted bouquet, her expression shifting from heartbreak to resolve. Far in the background on the left, through an open doorway, a man in a white tuxedo is seen from behind with his arm around another woman. In the shadowed right foreground, a tall, commanding dark-haired man in a black three-piece suit leans against a stone column, watching the bride intently while turning a sleek black credit card between his fingers. Use a shallow depth of field.

Composition: the top 15% of the image contains only the church's vaulted ceiling, with no heads or important objects, because it will be cropped off. Place the bride, the distant couple and the man by the column in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "IN BED WITH MY BROTHER-IN-LAW" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "THE GOTTI PACT. TWO BROTHERS. THREE DAYS." in the same font at about one third of the size, in deep wine red. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the credit card.
```

---

### 2026-10-12 · Traded by My Four Billionaire Mothers: Four Mothers, One Liar, and a Father in Another World

- **大标题**：TRADED BY MY FOUR BILLIONAIRE MOTHERS
- **小字**：ONE LIAR. ONE TRUE FATHER.
- **构图思路**：正文的核心是"两段人生"。画面左右两半：左边冷灰色调的豪宅喷泉花园，四位气场强大的女性（西装、学院风、晚礼服、军装）背对一个低头的少年，另一个笑着的少年站在她们中间；右边暖金色调的另一个世界，同一个少年和一位高大可靠的父亲并肩站立，父亲一只手搭在他肩上。中间用一道发光的"传送门"裂缝分开。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, split into two halves by a glowing vertical rift of light like a portal between worlds. On the left half, in cold grey-blue tones, four powerful, elegant women stand in front of a mansion garden fountain: one in a cream pinstripe suit, one in a preppy collared sweater, one in a silver evening gown and one in a dark green military officer's uniform. They stand turned away from a lonely teenage boy with his head lowered, while a smug teenage boy stands smiling among them. On the right half, in warm golden light, the same lonely boy now stands tall beside a strong, kind-looking father in a dark coat, who rests a protective hand on his shoulder as they look forward together. Use a shallow depth of field.

Composition: the top 15% of the image contains only sky on both halves, with no heads or important objects, because it will be cropped off. Place all figures in the middle band of the frame. The bottom third fades into a dark gradient across both halves.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "TRADED BY MY FOUR BILLIONAIRE MOTHERS" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "ONE LIAR. ONE TRUE FATHER." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-13 · Runaway Single Mom and Her Billionaire Hubby: The Animated Remake of a ReelShort Hit, Explained（计划外加写）

- **大标题**：RUNAWAY SINGLE MOM AND HER BILLIONAIRE HUBBY
- **小字**：ONE STORY, TWO VERSIONS
- ⚠️ 剧里有家暴情节，封面**不画暴力**，只画"出走"和"新家"的对比。不画真人演员（同一故事的真人版演员）的脸。
- **构图思路**：雨夜里，一位年轻母亲拖着旧行李箱、牵着一个背着书包的小女孩走在路边；前方街角停着一辆黑色豪车，车门打开，暖光照出来，一个穿深色大衣的男人撑着伞朝她们走来。背景远处是一座灯火通明的工厂建筑。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, moody rainy-night lighting in deep blue and grey with warm golden light ahead. On a wet city sidewalk, a tired but determined young mother in a worn factory jacket pulls an old suitcase with one hand and holds the hand of a small girl of about six with a backpack and pigtails. Ahead of them at the curb, the door of a sleek black car stands open, spilling warm light onto the wet street, and a tall, kind-looking man in a dark overcoat walks toward them holding an umbrella out to shelter them. In the hazy background, the lit windows of a large factory building glow through the rain. Use a shallow depth of field, with rain streaks catching the light.

Composition: the top 15% of the image contains only dark rainy sky, with no heads or important objects, because it will be cropped off. Place the mother, the girl and the man with the umbrella in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "RUNAWAY SINGLE MOM AND HER BILLIONAIRE HUBBY" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines. Directly beneath it, a smaller line reads "ONE STORY, TWO VERSIONS" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-13 · ReelShort・DramaBoxは安全？どこの国のアプリ？（日语，网站版）

- **大标题**：ショートドラマアプリは安全？
- **小字**：運営会社・評価・解約の注意点
- ⚠️ 按规则封面**不出现平台名**，大标题不写 ReelShort / DramaBox，也不画任何 App 图标、Logo 或国旗。
- ⚠️ 日文文字：GPT 对日文汉字和假名的渲染不稳定，尤其是「営」「評」「価」「約」这类笔画多的字。出图后逐字核对，写错就按规则 7 出无字图，再后期加字。小字较长，最容易出错，必要时只保留大标题。
- **构图思路**：正文回答两个问题，"是哪国的"和"安不安全"。画面中央是一部亮着的手机，屏幕上只有几张发光的竖屏剧照卡片（无文字）；手机前方放一个放大镜，正在"检查"它；背景是一个半透明的地球，上面亮着三个光点（大致在北美、东南亚、东亚的位置，不标国名），用细光线连向手机，暗示"运营方在海外"；手机旁边一个发光的盾牌和对勾图标，暗示"安全检查"。整体冷静、偏信息感，不要恐怖感。

```
A wide landscape (3:2) cinematic digital illustration in a clean, modern editorial style, with calm lighting in deep navy and soft teal and warm gold accents. In the center, a smartphone stands upright on a dark desk, its glowing screen showing a neat grid of small vertical drama thumbnail cards with romantic and dramatic scenes, with no text, logos or icons. In front of the phone, a large magnifying glass leans in as if inspecting it. Behind the phone floats a semi-transparent glowing globe, with three small points of light roughly over North America, Southeast Asia and East Asia, each connected to the phone by a thin line of light. Beside the phone, a softly glowing shield emblem with a simple checkmark symbolizes a safety check. The mood is reassuring and informative, not alarming. Use a shallow depth of field.

Composition: the top 15% of the image contains only the dark background and the top of the globe's glow, with no important objects, because it will be cropped off. Place the phone, the magnifying glass, the globe and the shield in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Japanese and must be written exactly, with correct kanji and kana. The main title reads "ショートドラマアプリは安全？" in large, bold, white Japanese gothic (sans-serif) letters. Directly beneath it, a smaller line reads "運営会社・評価・解約の注意点" in the same font at about one third of the size, in soft gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons, flags or watermarks anywhere in the image, including on the phone screen.
```

---

### 2026-10-13 · One Good Deed, One Great Fortune: A Brass Plumb Bob, Fifteen Years, and a Debt Repaid（计划外加写）

- **大标题**：ONE GOOD DEED, ONE GREAT FORTUNE
- **小字**：A DEBT REPAID FIFTEEN YEARS LATER
- **构图思路**：正文核心物件是"黄铜铅锤"。画一座黄昏下破败的木材场：前景是一只女人戴着精致手套的手，提着一根细绳，绳下垂着一枚闪亮的黄铜铅锤，正好悬在画面中央；铅锤后方虚化处，一个衣着朴素、神情疲惫的中年男人坐在一堆木料旁抬头望向她；远处地平线上隐约有油田抽油机的剪影（暗示她是石油大亨）。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, warm amber sunset light against deep shadow. In a run-down lumber yard at dusk, with stacks of weathered timber and an idle sawmill, the foreground shows an elegant woman's gloved hand holding a fine string from which hangs a gleaming brass plumb bob, suspended perfectly still in the center of the frame and catching the sunlight. Behind it, slightly out of focus, a tired, dignified middle-aged man in a worn work jacket sits on a stack of logs and looks up toward her with surprise and hope. On the distant horizon, the dark silhouettes of oil pump jacks stand against the glowing sky. Use a shallow depth of field, with the brass plumb bob in sharp focus.

Composition: the top 15% of the image contains only the sunset sky, with no heads or important objects, because it will be cropped off. Place the plumb bob, the gloved hand and the seated man in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "ONE GOOD DEED, ONE GREAT FORTUNE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines if needed. Directly beneath it, a smaller line reads "A DEBT REPAID FIFTEEN YEARS LATER" in the same font at about one third of the size, in warm brass gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-15 · 驚絮無聲：傻女的絕殺｜裝傻多年的沈家小女兒，其實是重生的金牌律師（繁中，计划外加写）

- **大标题**：驚絮無聲：傻女的絕殺
- **小字**：裝傻多年的她，其實是重生的金牌律師
- ⚠️ 繁体中文字：GPT 对「驚」「絮」「聲」「絕」「殺」等繁体字可能写成简体或错字，出图后逐字核对；写错就按规则 7 出无字图后期加字。
- **构图思路**：画正文里最关键的一幕"這字不能簽！"：豪华会议室长桌上摊着一份合约，一位中年父亲握着钢笔正要落笔；一只年轻女孩的手从画面一侧伸过来，稳稳按住合约。女孩穿着朴素可爱的衣服（扮傻的外表），但眼神冷静锐利；她身后玻璃窗的倒影里，是同一个人穿着律师西装、手抱案卷的身影（前世金牌律师）。周围几位西装人士神色惊愕。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with tense, dramatic lighting in cool steel blue and warm gold. In a luxurious corporate boardroom, a long polished table holds an open contract. A worried middle-aged Asian father in an expensive suit holds a fountain pen, about to sign. From the side, a young Asian woman's hand reaches in and presses firmly down on the contract to stop him. She wears a simple, slightly childish cardigan and hair clips, but her eyes are calm, sharp and determined. In the reflection on the floor-to-ceiling window behind her, the same young woman appears as a confident lawyer in a sharp black suit holding legal files, like a ghost of her past life. Several businessmen around the table stare in shock. Use a shallow depth of field, with the hand on the contract in sharp focus.

Composition: the top 15% of the image contains only the boardroom ceiling and window frame, with no heads or important objects, because it will be cropped off. Place the father, the young woman, her reflection and the contract in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The title is in Traditional Chinese characters and must be written exactly, with no Simplified Chinese characters. The main title reads "驚絮無聲：傻女的絕殺" in large, bold, white Traditional Chinese sans-serif characters. Directly beneath it, a smaller line reads "裝傻多年的她，其實是重生的金牌律師" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the contract, which shows only illegible lines.
```

---

### 2026-10-15 · Never Regret Leaving My Scum Family: Quinn's Second Life, the Coopers, and the Family That Finally Wanted Her（剧集暂未上线 ShortsBinge，计划外加写）

- **大标题**：NEVER REGRET LEAVING MY SCUM FAMILY
- **小字**：SHE LEFT. THEY LOST EVERYTHING.
- **构图思路**：正文核心是"两个家庭的对比"。画面左右分割：左边是冷灰色调的豪宅门厅，一家人（中年父母、一个西装青年、一个穿黑裙抹眼泪的年轻女孩）站在一起，背对着门口；右边门外是暖金色的晨光，年轻女主拖着一个小行李箱头也不回地走出去，门外一辆黑色豪车旁站着一对衣着优雅、神情温和的中年夫妇在等她。人物用泛化形象。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: painterly with a polished illustrated finish, split by an open front doorway. On the left, inside a cold grey marble mansion foyer, a family stands together turned away from the door: a stern middle-aged father, a cold elegant mother, a young man in a suit with a conflicted expression glancing back, and a young woman in a black dress dabbing fake tears while hiding a small smile. On the right, through the open door in warm golden morning light, a determined young woman with long dark hair in a smart blazer walks out without looking back, pulling a small suitcase. Outside, beside a sleek black car, a kind, elegant older couple waits for her with welcoming smiles. Use a shallow depth of field.

Composition: the top 15% of the image contains only the foyer ceiling and sky, with no heads or important objects, because it will be cropped off. Place all figures in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "NEVER REGRET LEAVING MY SCUM FAMILY" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines. Directly beneath it, a smaller line reads "SHE LEFT. THEY LOST EVERYTHING." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

---

### 2026-10-16 · No More Backing Down: The Rest Stop, the Front Seat, and the Girlfriend Who Finally Stopped Waiting（计划外加写）

- **大标题**：NO MORE BACKING DOWN
- **小字**：SHE STOPPED CHASING THE CAR.
- **构图思路**：画正文核心的一幕"被丢在休息站"：黄昏的公路休息站停车场，年轻女主（长棕发、挑染浅金色发片、灰色镂空针织开衫、浅色牛仔裤）手捧一杯冒热气的纸杯热水站在空车位上，背对镜头远处的公路上，一辆白色 SUV 的尾灯正驶向远方。她没有追，只是站着，神情从受伤转向平静。画面右侧远景隐约有海的方向的暖光，暗示她接下来的选择。不出现任何店铺招牌或品牌标识。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights from parking-lot lamps. A young woman with long brown hair and pale blonde face-framing highlights, wearing a loose grey open-knit cardigan over a white top and light-wash jeans, stands alone in an empty parking space at a highway rest stop, holding a steaming paper cup in both hands. Far behind her, on the highway, the red tail lights of a white SUV are disappearing into the distance. She is not running after it; her expression is hurt but calm and resolved. On the right side of the horizon, a faint warm glow suggests the direction of the sea. Use a shallow depth of field and soft rim light on her hair.

Composition: the top 15% of the image contains only the dusk sky, with no heads or important objects, because it will be cropped off. Place the woman and the distant SUV in the middle band of the frame. The bottom third fades into a dark gradient over the asphalt.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "NO MORE BACKING DOWN" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "SHE STOPPED CHASING THE CAR." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, store signs, app icons or watermarks anywhere in the image.
```

---

### 2026-10-19 · Taming My Bullies: Emma Parker, Rowan Calloway and the Big Four Who Picked the Wrong Girl（计划外加写）

- **大标题**：TAMING MY BULLIES
- **小字**：SHE DOESN'T BACK DOWN.
- **构图思路**（2026-10-19 修订版）：初版"浑身湿透的女生把男生按倒在地 + 校服 + 学生围观"被 GPT 判违规，大概率是三个因素叠加：看起来像未成年的校服学生、肢体冲突、湿身。修订版改成：
  - 人物明确写成大学年纪的成年人（young adults in their early twenties），服装改成精英学院的西装外套，不写短裙、不写"湿透"；
  - 冲突改成"对峙"而不是"打斗"：宏伟的学院走廊里，金发女主腋下夹着击剑面罩（点题她是击剑冠军），抬着下巴直视前方；对面四个衣着考究的富家子弟站成一排，领头的深色卷发男生双手插兜、带着傲慢的笑；
  - 不写手机、围观、按倒等词。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody late-afternoon lighting in deep blue and violet tones and warm golden light falling through tall arched windows. In the grand marble hallway of an elite private academy, a confident young woman in her early twenties with blonde hair stands on the left, wearing a tailored navy academy blazer over a white shirt with a yellow bow, holding a white fencing mask under one arm. Her chin is raised and her gaze is steady and unafraid. Facing her on the right, a few steps away, four well-dressed young men in their early twenties stand in a loose line in designer blazers. Their leader, a handsome young man with dark curly hair and a loosened tie, stands slightly in front with his hands in his pockets and an arrogant half-smile. The mood is a tense, dramatic standoff with no physical contact. Use a shallow depth of field and soft rim light on the woman and the leader.

Composition: the top 15% of the image contains only the vaulted ceiling and the tops of the arched windows, with no heads or important objects, because it will be cropped off. Place all figures in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "TAMING MY BULLIES" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "SHE DOESN'T BACK DOWN." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, crests or watermarks anywhere in the image.
```

---

### 2026-10-19 · Where My Love Went Wrong: Winnie, the Marshal and the Son Who Wanted a Prettier Mom（计划外加写）

- **大标题**：WHERE MY LOVE WENT WRONG
- **小字**：SHE WALKED OUT. HE WAS TOO LATE.
- **构图思路**：民国风。画面左侧是一间昏暗的西式餐厅，长桌旁坐着身穿军装的年轻元帅、一个穿格纹西装的小男孩，和一位卷发、穿粉色洋装的年轻女子，三人围着生日蛋糕笑；右侧前景，女主（长辫、米色旗袍）背对餐桌、手里拿着一份文件，正走向门外明亮的光里，神情平静坚定。人物用泛化东亚形象，不画真实演员的脸。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, set in 1930s China, with moody dusk lighting in deep blue and violet tones and a few warm accent lights from candles and chandeliers. On the left, in a dim Western-style dining room, a handsome young East Asian marshal in a blue military uniform, a young boy in a plaid suit and an elegant young woman with curled hair in a pink 1930s dress sit around a birthday cake, smiling at each other. On the right, in the foreground, a graceful young East Asian woman with a long single braid, wearing a cream qipao, has turned her back on the table and walks toward an open doorway full of bright light, holding a folded document. Her expression is calm and resolved. Use a shallow depth of field and soft rim light on her.

Composition: the top 15% of the image contains only the dark ceiling and chandelier glow, with no heads or important objects, because it will be cropped off. Place all figures in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "WHERE MY LOVE WENT WRONG" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines. Directly beneath it, a smaller line reads "SHE WALKED OUT. HE WAS TOO LATE." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image, including on the document.
```

---

### 2026-10-20 · Gamble of Love: Tammy Sullivan, the Brother Who Sold Her and the Husband Who Can't Taste a Thing（计划外加写）

- **大标题**：GAMBLE OF LOVE
- **小字**：SHE CAN'T SPEAK. SHE CAN MIX.
- **构图思路**：避开剧中下药、绑架、床戏等开场内容（按规则 8 不画冲突和亲密场景），画"调酒师 T"这个反转：昏暗的高级酒吧，吧台后面是一位二十出头的东亚女性（长发、粉色发带蝴蝶结、浅粉开衫），低头专注地把酒倒进一只插着粉色玫瑰的高脚杯，神情安静自信；吧台另一端，一位穿驼色西装的年轻男人端着酒杯，疑惑地看向她。暖红色吊灯和背景酒架的金色反光。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody night lighting in deep blue and violet tones and warm red and gold accent lights from vintage pendant lamps. Behind the polished bar of an elegant speakeasy lined with glowing bottles, a graceful East Asian woman in her early twenties with long dark hair and a soft pink bow, wearing a light pink cardigan, calmly pours a pale golden cocktail into a stemmed glass decorated with a small pink rose. Her expression is quiet, focused and confident. At the far end of the bar, a handsome East Asian man in his late twenties in a camel double-breasted suit holds a glass and looks toward her with curious, puzzled eyes. Use a shallow depth of field, with the cocktail and her hands in sharp focus.

Composition: the top 15% of the image contains only the dark ceiling and the glow of the pendant lamps, with no heads or important objects, because it will be cropped off. Place both figures and the bar in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "GAMBLE OF LOVE" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "SHE CAN'T SPEAK. SHE CAN MIX." in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, bottle labels or watermarks anywhere in the image.
```

---

### 2026-10-23 · Female Draco Malfoy Took Over the Internet. One Short Drama Was Already Doing It（热点稿，计划外加写）

- **大标题**：THE RIVAL, BUT MAKE HER A GIRL
- **小字**：SHORT DRAMAS FOR THE FEMALE DRACO ERA
- **构图思路**：⚠️ 哈利·波特是版权 IP，封面**不能出现**马尔福、霍格沃茨、斯莱特林院徽、绿银配色的院服、魔杖、"Draco/Malfoy/Harry Potter" 等字样。只画"同款气质"：二十出头的金发女生，穿一件深色西装外套配松开的领带（不带任何徽章），双臂抱胸、下巴微抬、嘴角挂着傲慢的笑，站在一座泛用的古典石砌走廊里；背景虚化处有一个穿橄榄球外套的年轻男人回头看她（呼应 Married to My Alpha Rival）。人物写明成年人，无肢体接触（规则 8）。

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights from tall arched windows. In a generic old stone corridor with Gothic arches, a confident young woman in her early twenties with sleek platinum-blonde hair stands in the foreground, wearing a tailored dark blazer over a white shirt with a loosened dark tie, with no badges, crests or emblems anywhere. Her arms are crossed, her chin is raised, and she wears a smug, teasing half-smile, as if she has just won an argument. In the soft-focus background, a young man in his early twenties wearing a varsity football jacket glances back at her, caught off guard. There is no physical contact. Use a shallow depth of field and soft rim light on her hair.

Composition: the top 15% of the image contains only the vaulted stone ceiling, with no heads or important objects, because it will be cropped off. Place both figures in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "THE RIVAL, BUT MAKE HER A GIRL" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written, on two lines. Directly beneath it, a smaller line reads "SHORT DRAMAS FOR THE FEMALE DRACO ERA" in the same font at about one third of the size, in warm gold. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, crests, house colors or watermarks anywhere in the image.
```
