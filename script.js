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
  document.getElementById('codeInput').focus();
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('analyzeBtn').click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
    e.preventDefault();
    document.getElementById('toggleHistoryBtn').click();
  }
});

// ===== CODE STATS =====
function updateStats() {
  const code = document.getElementById('codeInput').value;
  const lines = code.split('\n').length;
  const chars = code.length;
  document.getElementById('lineCount').textContent = `📄 Lines: ${lines}`;
  document.getElementById('charCount').textContent = `📝 Characters: ${chars}`;
  const langBadge = document.getElementById('langBadge');
  if (code.includes('def ') || code.includes('import ') || code.includes('class ')) {
    langBadge.textContent = 'Python';
  } else if (code.includes('function ') || code.includes('const ') || code.includes('let ')) {
    langBadge.textContent = 'JavaScript';
  } else if (code.includes('public class ') || code.includes('System.out.println')) {
    langBadge.textContent = 'Java';
  } else {
    langBadge.textContent = 'Unknown';
  }
}

document.getElementById('codeInput').addEventListener('input', updateStats);
updateStats();

// ===== CLEAR CODE =====
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('codeInput').value = '';
  updateStats();
  document.getElementById('output').innerHTML = `<div class="placeholder">
    <i class="fas fa-code" style="display:block; font-size:2rem; margin-bottom:0.5rem; color:#333;"></i>
    Results will appear here
  </div>`;
});

// ===== COPY TO CLIPBOARD =====
document.getElementById('copyBtn').addEventListener('click', async () => {
  const output = document.getElementById('output').textContent;
  if (output && !output.includes('Results will appear here')) {
    try {
      await navigator.clipboard.writeText(output);
      const btn = document.getElementById('copyBtn');
      btn.innerHTML = '✅ Copied!';
      setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Copy', 2000);
    } catch {
      alert('Failed to copy.');
    }
  } else {
    alert('No results to copy.');
  }
});

// ===== DOWNLOAD AS .TXT =====
document.getElementById('downloadBtn').addEventListener('click', () => {
  const output = document.getElementById('output').textContent;
  if (output && !output.includes('Results will appear here')) {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    alert('No results to download.');
  }
});

// ===== EXPORT AS PDF =====
document.getElementById('pdfBtn').addEventListener('click', () => {
  const output = document.getElementById('output');
  const content = output.textContent;

  if (!content || content.includes('Results will appear here') || content.includes('Analyzing your code')) {
    alert('No results to export. Please analyze some code first.');
    return;
  }

  const tempDiv = document.createElement('div');
  tempDiv.style.padding = '30px';
  tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  tempDiv.style.maxWidth = '800px';
  tempDiv.style.margin = '0 auto';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.color = '#1a1a1a';
  tempDiv.style.borderRadius = '8px';
  tempDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  tempDiv.innerHTML = `
    <h1 style="font-size:24px;font-weight:700;margin-bottom:4px;color:#1a1a1a;">🧠 AI Debug Report</h1>
    <p style="color:#666;font-size:14px;margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:12px;">
      Generated on ${new Date().toLocaleString()}
    </p>
    <pre style="font-family:'JetBrains Mono','Courier New',monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;background:#f5f5f5;padding:16px;border-radius:6px;border:1px solid #e0e0e0;color:#1a1a1a;">${content}</pre>
    <p style="color:#999;font-size:11px;margin-top:20px;border-top:1px solid #eee;padding-top:12px;text-align:center;">
      Built with ✦ ai debug · ast + gemini
    </p>
  `;

  document.body.appendChild(tempDiv);

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `ai-debug-report-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, letterRendering: true, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(tempDiv).save().then(() => {
    document.body.removeChild(tempDiv);
  });
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

  if (!list || !count || !clearBtn) return;

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

  // --- SHOW LOADING SPINNER ---
  output.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <div class="spinner-text">Analyzing your code...</div>
    </div>
  `;

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
    saveToHistory(code, data);

  } catch (err) {
    output.innerHTML = `<div class="placeholder">❌ Network error: ${err.message}</div>`;
  }
});

// ===== INITIALIZE HISTORY ON LOAD =====
renderHistory();
