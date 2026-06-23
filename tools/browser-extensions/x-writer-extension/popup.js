const deepseekKeyInput = document.getElementById('deepseekKey');
const claudeKeyInput = document.getElementById('claudeKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const modelTabs = document.querySelectorAll('.model-tab');

let activeModel = 'deepseek';

// ── Load saved settings ────────────────────────────────────────────────────────
chrome.storage.sync.get(['deepseekKey', 'claudeKey', 'activeModel'], (syncResult) => {
  chrome.storage.local.get(['deepseekKey', 'claudeKey'], (localResult) => {
    const migratedKeys = {};
    const deepseekKey = localResult.deepseekKey || syncResult.deepseekKey || '';
    const claudeKey = localResult.claudeKey || syncResult.claudeKey || '';

    if (deepseekKey) deepseekKeyInput.value = deepseekKey;
    if (claudeKey) claudeKeyInput.value = claudeKey;

    if (!localResult.deepseekKey && syncResult.deepseekKey) migratedKeys.deepseekKey = syncResult.deepseekKey;
    if (!localResult.claudeKey && syncResult.claudeKey) migratedKeys.claudeKey = syncResult.claudeKey;
    if (Object.keys(migratedKeys).length) chrome.storage.local.set(migratedKeys);
  });

  if (syncResult.activeModel) {
    activeModel = syncResult.activeModel;
    setActiveTab(activeModel);
  }
});

// ── Tab switching ──────────────────────────────────────────────────────────────
modelTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeModel = tab.dataset.model;
    setActiveTab(activeModel);
  });
});

function setActiveTab(model) {
  modelTabs.forEach(t => t.classList.toggle('active', t.dataset.model === model));
  document.querySelectorAll('.key-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${model}`).classList.add('active');
}

// ── Save ───────────────────────────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  const deepseekKey = deepseekKeyInput.value.trim();
  const claudeKey = claudeKeyInput.value.trim();

  // Validate the active model's key
  if (activeModel === 'deepseek' && deepseekKey && !deepseekKey.startsWith('sk-')) {
    showStatus('DeepSeek key should start with sk-...', 'error');
    return;
  }
  if (activeModel === 'claude' && claudeKey && !claudeKey.startsWith('sk-ant-')) {
    showStatus('Claude key should start with sk-ant-...', 'error');
    return;
  }

  chrome.storage.local.set({ deepseekKey, claudeKey }, () => {
    chrome.storage.sync.set({ activeModel }, () => {
      chrome.storage.sync.remove(['deepseekKey', 'claudeKey']);
      showStatus('✓ Saved', 'success');
    });
  });
});

function showStatus(msg, type) {
  status.textContent = msg;
  status.style.color = type === 'error' ? '#d93025' : '#00ba7c';
  if (type === 'success') setTimeout(() => { status.textContent = ''; }, 3000);
}

// Enter to save
[deepseekKeyInput, claudeKeyInput].forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
});
