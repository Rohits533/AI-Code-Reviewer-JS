// ===== SMOOTH SCROLL =====
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== TRY IT NOW =====
document.getElementById('tryItBtn').addEventListener('click', () => {
  document.getElementById('docs').scrollIntoView({ behavior: 'smooth' });
});

// ===== HISTORY FUNCTIONS =====
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('analysisHistory')) || [];
  } catch {
    return [];
  }
}

function saveToHistory(code, result) {
  const history = getHistory();
  const entry = {
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    code: code.slice(0, 200) + (code.length > 200 ? '...' : ''),
    fullCode: code,
    result: result,
    issues: result.ast_report?.issues_count ?? result.issues_count ?? 0
  };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem('analysisHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  const list = document.getElementById('historyList');
  const count = document.getElementById('historyCount');
  const clearBtn = document.getElementById('clearHistoryBtn');

  count.textContent = history.length;

  if (history.length === 0) {
    list.innerHTML = `<div style="color: rgba(255,255,255,0.3); font-size: 0.8rem; padding: 0.5rem 0;">No past analyses yet.</div>`;
    clearBtn.style.display = 'none';
    return;
  }

  clearBtn.style.display = 'inline-block';
  list.innerHTML = history.map(item => `
    <div class="history-item">
      <span class="timestamp">${item.timestamp}</span>
      <div><strong>${item.issues} issue${item.issues !== 1 ? 's' : ''} found</strong></div>
      <div class="code-snippet">${item.code}</div>
      <span class="issues-badge">${item.issues} issues</span>
    </div>
  `).join('');
}

function clearHistory() {
  if (confirm('Clear all saved analyses?')) {
    localStorage.removeItem('analysisHistory');
    renderHistory();
  }
}

// ===== TOGGLE HISTORY =====
document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
  const list = document.getElementById('historyList');
  if (list.style.display === 'none') {
    list.style.display = 'block';
    renderHistory();
    document.getElementById('toggleHistoryBtn').textContent = `📜 Hide History (${getHistory().length})`;
  } else {
    list.style.display = 'none';
    document.getElementById('toggleHistoryBtn').textContent = `📜 View Analysis History (${getHistory().length})`;
  }
});

document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

// ===== ANALYZE =====
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const code = document.getElementById('codeInput').value;
  const output = document.getElementById('output');

  if (!code.trim()) {
    output.innerHTML = `<div class="placeholder">⚠️ Please paste some code.</div>`;
    return;
  }

  output.innerHTML = `<div class="placeholder">⏳ Analyzing...</div>`;

  try {
    const res = await fetch('https://ai-code-reviewer-js.onrender.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (!res.ok) {
      output.innerHTML = `<div class="placeholder">❌ Error: ${data.error || 'Something went wrong'}</div>`;
      return;
    }

    const ast = data.ast_report || data;
    let text = '📊 STATIC ANALYSIS (AST)\n';
    text += '----------------------------\n';
    text += `Unused Variables: ${(ast.unused_variables || []).join(', ') || 'None'}\n`;
    text += `Unused Imports: ${(ast.unused_imports || []).join(', ') || 'None'}\n`;
    text += `Total Issues: ${ast.issues_count || 0}\n\n`;

    if (data.ai_review) {
      text += '🧠 AI REVIEW (Gemini)\n';
      text += '----------------------------\n';
      text += data.ai_review;
    }

    output.textContent = text;

    // ===== SAVE TO HISTORY =====
    saveToHistory(code, data);

  } catch (err) {
    output.innerHTML = `<div class="placeholder">❌ Network error: ${err.message}</div>`;
  }
});

// ===== INITIALIZE HISTORY ON LOAD =====
renderHistory();
