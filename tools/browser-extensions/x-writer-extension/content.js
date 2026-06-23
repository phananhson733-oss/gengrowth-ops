// Content script — injected into x.com

(function () {
  'use strict';

  if (document.getElementById('xwriter-panel')) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let panelVisible = false;
  let lastFocusedTextarea = null;
  let isLoading = false;

  // ── Track last focused X textarea ──────────────────────────────────────────
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el && (
      el.getAttribute('data-testid') === 'tweetTextarea_0' ||
      el.closest('[data-testid="tweetTextarea_0"]') ||
      el.getAttribute('role') === 'textbox'
    )) {
      lastFocusedTextarea = el;
    }
  });

  // ── Build panel ────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'xwriter-panel';
  panel.innerHTML = `
    <div id="xwriter-header">
      <span id="xwriter-title">✍️ X Writer</span>
      <div id="xwriter-model-switch">
        <button class="xwriter-model-btn active" data-model="deepseek">DeepSeek</button>
        <button class="xwriter-model-btn" data-model="claude">Claude</button>
      </div>
      <button id="xwriter-close" title="Close">×</button>
    </div>

    <div id="xwriter-body">
      <label class="xwriter-label">Tweet context (auto-filled or paste manually)</label>
      <textarea id="xwriter-context" placeholder="Paste the tweet you're replying to..." rows="2"></textarea>

      <label class="xwriter-label">Your idea in Chinese (optional for Suggest)</label>
      <textarea id="xwriter-input" placeholder="输入你想说的，关键意思即可..." rows="3"></textarea>

      <div class="xwriter-meta-row">
        <div class="xwriter-meta-group">
          <span class="xwriter-meta-label">回复对象</span>
          <div class="xwriter-pills" id="xwriter-context-type">
            <button class="xwriter-pill active" data-value="own">我的推文</button>
            <button class="xwriter-pill" data-value="others">他人推文</button>
            <button class="xwriter-pill" data-value="nested">回复的回复</button>
          </div>
        </div>
        <div id="xwriter-original-tweet-wrapper" style="display:block">
          <label class="xwriter-label">我的原推文（粘贴被评论的那条）</label>
          <textarea id="xwriter-original-tweet" placeholder="粘贴你被评论的原推文内容，帮助模型理解对方在回应什么..." rows="2"></textarea>
        </div>
        <div class="xwriter-meta-group">
          <span class="xwriter-meta-label">互动类型</span>
          <div class="xwriter-pills" id="xwriter-interact-type">
            <button class="xwriter-pill active" data-value="discussion">观点讨论</button>
            <button class="xwriter-pill" data-value="casual">轻松短回</button>
            <button class="xwriter-pill" data-value="compliment">赞赏认同</button>
            <button class="xwriter-pill" data-value="question">提问</button>
            <button class="xwriter-pill" data-value="challenge">质疑挑战</button>
          </div>
        </div>
      </div>

      <div id="xwriter-actions">
        <button id="xwriter-submit">Translate →</button>
        <button id="xwriter-suggest">Suggest reply</button>
      </div>

      <div id="xwriter-output-wrapper" style="display:none">
        <div id="xwriter-output-header">
          <span class="xwriter-label" id="xwriter-output-label">Result</span>
          <div id="xwriter-output-btns">
            <button id="xwriter-copy">Copy</button>
            <button id="xwriter-insert">Insert</button>
          </div>
        </div>
        <div id="xwriter-output"></div>
      </div>

      <div id="xwriter-error" style="display:none"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Toggle button ──────────────────────────────────────────────────────────
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'xwriter-toggle';
  toggleBtn.title = 'X Writer — 中文转英文 (Alt+X)';
  toggleBtn.textContent = '✍️';
  document.body.appendChild(toggleBtn);

  // ── Meta selectors state ───────────────────────────────────────────────────
  let contextType = 'own';    // own / others / nested
  let interactType = 'discussion'; // discussion / casual / compliment / question / challenge

  function initPillGroup(groupId, stateSetter) {
    const group = panel.querySelector(`#${groupId}`);
    group.querySelectorAll('.xwriter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.xwriter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        stateSetter(btn.dataset.value);
      });
    });
  }

  initPillGroup('xwriter-context-type', v => {
    contextType = v;
    const wrapper = document.getElementById('xwriter-original-tweet-wrapper');
    wrapper.style.display = v === 'own' ? 'block' : 'none';
  });
  initPillGroup('xwriter-interact-type', v => { interactType = v; });

  // ── Model switcher state ───────────────────────────────────────────────────
  let activeModel = 'deepseek';

  // Load saved model preference
  chrome.storage.sync.get(['activeModel'], (result) => {
    if (result.activeModel) {
      activeModel = result.activeModel;
      updateModelUI();
    }
  });

  function updateModelUI() {
    panel.querySelectorAll('.xwriter-model-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === activeModel);
    });
  }

  panel.querySelectorAll('.xwriter-model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeModel = btn.dataset.model;
      updateModelUI();
      chrome.storage.sync.set({ activeModel });
    });
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showPanel() {
    panel.classList.add('visible');
    panelVisible = true;
    setTimeout(() => document.getElementById('xwriter-input')?.focus(), 100);
  }

  function hidePanel() {
    panel.classList.remove('visible');
    panelVisible = false;
  }

  function showError(msg) {
    const el = document.getElementById('xwriter-error');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('xwriter-output-wrapper').style.display = 'none';
  }

  function clearError() {
    document.getElementById('xwriter-error').style.display = 'none';
  }

  function setLoading(loading) {
    isLoading = loading;
    document.getElementById('xwriter-submit').disabled = loading;
    document.getElementById('xwriter-suggest').disabled = loading;
  }

  function parseSuggestedReplies(text) {
    const matches = [...text.matchAll(/(?:^|\n)([ABC]):\s*([\s\S]*?)(?=\n[ABC]:|$)/g)];
    return matches.map(match => {
      const body = match[2]
        .split('\n')
        .filter(line => !line.trim().startsWith('💬'))
        .join('\n')
        .trim();
      return { label: match[1], text: body };
    }).filter(option => option.text);
  }

  function renderSuggestionActions(text) {
    const containerId = 'xwriter-suggestion-actions';
    document.getElementById(containerId)?.remove();

    const options = parseSuggestedReplies(text);
    if (!options.length) return;

    const actions = document.createElement('div');
    actions.id = containerId;

    options.forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `Copy ${option.label}`;
      btn.addEventListener('click', () => {
        copyToClipboard(option.text).then(() => {
          btn.textContent = `Copied ${option.label}`;
          setTimeout(() => { btn.textContent = `Copy ${option.label}`; }, 1600);
        }).catch(err => showError(err.message || '复制失败'));
      });
      actions.appendChild(btn);
    });

    document.getElementById('xwriter-output-wrapper').appendChild(actions);
  }

  function showOutput(text, label) {
    document.getElementById('xwriter-output-label').textContent = label || 'Result';
    document.getElementById('xwriter-output').textContent = text;
    document.getElementById('xwriter-output-wrapper').style.display = 'block';
    // Insert button hidden for suggest mode (multiple options, user picks one)
    const isMulti = label === 'Suggested replies';
    document.getElementById('xwriter-insert').style.display = isMulti ? 'none' : 'inline-block';
    document.getElementById('xwriter-suggestion-actions')?.remove();
    if (isMulti) renderSuggestionActions(text);
  }

  function extractTweetText() {
    // 1. 优先从回复弹窗（dialog）里获取——这是用户点击 Reply 时 X 展示的原推文
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const dialogTweet = dialog.querySelector('[data-testid="tweetText"]');
      if (dialogTweet) return dialogTweet.innerText.trim();
    }

    // 2. 尝试找 lastFocusedTextarea 最近的推文（inline reply 场景）
    if (lastFocusedTextarea) {
      let el = lastFocusedTextarea;
      while (el && el !== document.body) {
        el = el.parentElement;
        // 找到包含 textarea 的区块，再往前找最近的 tweet article
        const prevArticle = el?.previousElementSibling?.querySelector?.('[data-testid="tweetText"]');
        if (prevArticle) return prevArticle.innerText.trim();
      }
    }

    // 3. 兜底：取第一条，但加警告标注
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    if (articles.length > 0) {
      const textEl = articles[0].querySelector('[data-testid="tweetText"]');
      if (textEl) return `[推文1，请确认是否需要手动替换]\n${textEl.innerText.trim()}`;
    }

    return '';
  }

  function tryAutoFillContext() {
    const contextInput = document.getElementById('xwriter-context');
    if (contextInput && !contextInput.value) {
      const auto = extractTweetText();
      if (auto) contextInput.value = auto;
    }
  }

  function extractTweetFromOutput(text) {
    const match = text.match(/TWEET:\n([\s\S]*?)(?:\n\nCHARS:|$)/);
    return match ? match[1].trim() : text;
  }

  // Copy to clipboard — no DOM injection to avoid X risk control
  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  }

  function getStoredKeys() {
    return new Promise(resolve => {
      chrome.storage.local.get(['deepseekKey', 'claudeKey'], localResult => {
        if (localResult.deepseekKey || localResult.claudeKey) {
          resolve(localResult);
          return;
        }

        // Backward compatibility for keys saved before v1.0.1.
        chrome.storage.sync.get(['deepseekKey', 'claudeKey'], syncResult => {
          if (syncResult.deepseekKey || syncResult.claudeKey) {
            chrome.storage.local.set(syncResult, () => resolve(syncResult));
            return;
          }
          resolve({});
        });
      });
    });
  }

  function sendExtensionMessage(message) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { error: 'No response from extension background worker.' });
      });
    });
  }

  // ── Translate ──────────────────────────────────────────────────────────────
  document.getElementById('xwriter-submit').addEventListener('click', async () => {
    if (isLoading) return;
    clearError();

    const chineseText = document.getElementById('xwriter-input').value;
    const tweetContext = document.getElementById('xwriter-context').value;

    if (!chineseText.trim()) {
      showError('请输入中文内容');
      return;
    }

    try {
      setLoading(true);
      const keys = await getStoredKeys();
      const apiKey = activeModel === 'claude' ? keys.claudeKey : keys.deepseekKey;

      const response = await sendExtensionMessage({
        type: 'TRANSLATE',
        payload: { chineseText, tweetContext, model: activeModel, apiKey, interactType }
      });

      if (response.error) { showError(response.error); return; }
      showOutput(response.result, 'Translation');
    } catch (err) {
      showError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  });

  // ── Suggest ────────────────────────────────────────────────────────────────
  document.getElementById('xwriter-suggest').addEventListener('click', async () => {
    if (isLoading) return;
    clearError();

    tryAutoFillContext();
    const tweetContext = document.getElementById('xwriter-context').value;
    if (!tweetContext.trim()) {
      showError('需要推文内容才能生成建议，请等待自动获取或手动粘贴');
      return;
    }

    try {
      setLoading(true);
      const keys = await getStoredKeys();
      const apiKey = activeModel === 'claude' ? keys.claudeKey : keys.deepseekKey;

      const originalTweet = document.getElementById('xwriter-original-tweet')?.value || '';
      const response = await sendExtensionMessage({
        type: 'SUGGEST',
        payload: { tweetContext, originalTweet, model: activeModel, apiKey, contextType, interactType }
      });

      if (response.error) { showError(response.error); return; }
      showOutput(response.result, 'Suggested replies');
    } catch (err) {
      showError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  });

  // ── Copy ───────────────────────────────────────────────────────────────────
  document.getElementById('xwriter-copy').addEventListener('click', () => {
    const text = document.getElementById('xwriter-output').textContent;
    const label = document.getElementById('xwriter-output-label').textContent;
    const toCopy = label === 'Translation' ? extractTweetFromOutput(text) : text;

    copyToClipboard(toCopy).then(() => {
      const btn = document.getElementById('xwriter-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    }).catch(err => showError(err.message || '复制失败'));
  });

  // ── Insert — copy + hint to paste manually (avoids X risk control) ─────────
  document.getElementById('xwriter-insert').addEventListener('click', () => {
    const text = document.getElementById('xwriter-output').textContent;
    const tweetText = extractTweetFromOutput(text);

    copyToClipboard(tweetText).then(() => {
      const btn = document.getElementById('xwriter-insert');
      btn.textContent = 'Copied — ⌘V to paste';
      btn.style.fontSize = '11px';
      setTimeout(() => {
        btn.textContent = 'Insert';
        btn.style.fontSize = '';
      }, 3000);
    }).catch(err => showError(err.message || '复制失败'));
  });

  // ── Close ──────────────────────────────────────────────────────────────────
  document.getElementById('xwriter-close').addEventListener('click', hidePanel);

  // ── Toggle button ──────────────────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    if (panelVisible) { hidePanel(); } else { tryAutoFillContext(); showPanel(); }
  });

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyX') {
      e.preventDefault();
      if (panelVisible) { hidePanel(); } else { tryAutoFillContext(); showPanel(); }
    }
    if (e.code === 'Escape' && panelVisible) hidePanel();
  });

  document.getElementById('xwriter-input').addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      document.getElementById('xwriter-submit').click();
    }
  });

})();
