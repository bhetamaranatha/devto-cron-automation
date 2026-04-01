// =============================================
// LinkedIn Automation Dashboard — Frontend JS
// =============================================

const API = {
    stats: '/api/stats',
    executions: '/api/executions',
    insights: '/api/insights',
    run: '/api/run',
};

let refreshTimer = null;

// ---- Helpers ----

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatDuration(ms) {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function statusBadge(status) {
    const map = {
        success: { cls: 'badge--success', icon: '✓', label: 'Success' },
        failed: { cls: 'badge--failed', icon: '✕', label: 'Failed' },
        skipped: { cls: 'badge--skipped', icon: '⤳', label: 'Skipped' },
    };
    const s = map[status] || { cls: '', icon: '?', label: status };
    return `<span class="badge ${s.cls}">${s.icon} ${s.label}</span>`;
}

function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

// ---- Fetch ----

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ---- Render Stats ----

function renderStats(stats, insightCount) {
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statSuccess').textContent = stats.success;
    document.getElementById('statFailed').textContent = stats.failed;
    document.getElementById('statSkipped').textContent = stats.skipped;
    document.getElementById('statInsights').textContent = insightCount;
}

// ---- Render Executions ----

function renderExecutions(executions) {
    const body = document.getElementById('execBody');
    const count = document.getElementById('execCount');

    count.textContent = `${executions.length} records`;

    if (!executions.length) {
        body.innerHTML = `<tr><td colspan="6" class="empty">No executions yet. Click "Run Now" to start.</td></tr>`;
        return;
    }

    body.innerHTML = executions.map(row => {
        const hasContent = !!row.content;
        const contentPreview = hasContent
            ? `<button class="preview-link" onclick="openModal(${JSON.stringify(row.content).replace(/'/g, "&#39;")})">View Content ↗</button>`
            : '<span style="color:var(--text-muted)">—</span>';

        // Support both old and new field names for backward compatibility (if needed)
        const articleUrl = row.articleUrl || row.url;
        const articleId = row.articleId || row.linkedinPostId;

        const devToCell = articleUrl
            ? `<a href="${articleUrl}" target="_blank" class="postid-cell" style="color:var(--primary);text-decoration:none;">Open Dev.to ↗</a>`
            : (articleId ? `<span class="postid-cell">${articleId}</span>` : '—');

        const topic = row.topic
            ? `<span class="topic-cell" title="${row.topic}">${row.topic}</span>`
            : '—';

        return `<tr>
          <td><span class="timestamp">${formatDate(row.timestamp)}</span></td>
          <td>${statusBadge(row.status)}</td>
          <td>${topic}</td>
          <td>${contentPreview}</td>
          <td>${devToCell}</td>
          <td><span class="duration-cell">${formatDuration(row.durationMs)}</span></td>
        </tr>`;
    }).join('');
}

// ---- Render Insights ----

function renderInsights(insights) {
    const list = document.getElementById('insightsList');
    if (!insights.length) {
        list.innerHTML = `<div class="no-insights">No insights yet. Insights are generated automatically after each successful article.</div>`;
        return;
    }
    list.innerHTML = insights.map((ins, i) => `
      <li class="insight-item">
        <span class="insight-num">${i + 1}</span>
        <div>
          <div class="insight-note">${ins.note}</div>
          <div class="insight-meta">${formatDate(ins.timestamp)} · ${ins.topic || ''}</div>
        </div>
      </li>
    `).join('');
}

// ---- Modal ----

function openModal(content) {
    document.getElementById('modalContent').textContent = content;
    document.getElementById('modalBackdrop').classList.add('open');
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modalBackdrop').classList.remove('open');
});
document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('modalBackdrop').classList.remove('open');
    }
});

// ---- Load All Data ----

async function loadAll() {
    try {
        const [stats, executions, insights] = await Promise.all([
            fetchJSON(API.stats),
            fetchJSON(API.executions),
            fetchJSON(API.insights),
        ]);
        renderStats(stats, insights.length);
        renderExecutions(executions);
        renderInsights(insights);
        document.getElementById('lastRefresh').textContent =
            'Updated ' + new Date().toLocaleTimeString();
    } catch (err) {
        console.error('Failed to load data:', err);
        showToast('Failed to refresh data.');
    }
}

// ---- Refresh Button ----

document.getElementById('btnRefresh').addEventListener('click', () => {
    loadAll();
    resetAutoRefresh();
});

// ---- Run Now Button ----

document.getElementById('btnRunNow').addEventListener('click', async () => {
    const btn = document.getElementById('btnRunNow');
    btn.disabled = true;
    btn.textContent = '⏳ Running...';
    try {
        await fetch(API.run, { method: 'POST' });
        showToast('Workflow started! Refreshing in 15s...');
        setTimeout(() => loadAll(), 15000);
    } catch (err) {
        showToast('Failed to trigger run.');
    } finally {
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = '▶ Run Now';
        }, 3000);
    }
});

// ---- Auto-Refresh every 30s ----

function resetAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadAll, 30000);
}

// ---- Init ----
loadAll();
resetAutoRefresh();
