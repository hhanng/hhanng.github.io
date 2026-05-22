/* =============================================
   FAANG Application Tracker — Agent #48
   localStorage, no APIs required
   ============================================= */

'use strict';

// ── CONSTANTS ──────────────────────────────────
const STORAGE_KEY = 'faang-tracker-48-v1';

const QUICK_COMPANIES = ['Google','Meta','Apple','Amazon','Netflix','Microsoft'];

const STATUSES = [
  { key: 'applied',  label: 'Applied',       badge: 'badge-applied'  },
  { key: 'oa',       label: 'OA Sent',        badge: 'badge-oa'       },
  { key: 'oa-done',  label: 'OA Complete',    badge: 'badge-oa-done'  },
  { key: 'phone',    label: 'Phone Screen',   badge: 'badge-phone'    },
  { key: 'tech',     label: 'Technical',      badge: 'badge-tech'     },
  { key: 'onsite',   label: 'Onsite',         badge: 'badge-onsite'   },
  { key: 'offer',    label: 'Offer',          badge: 'badge-offer'    },
  { key: 'rejected', label: 'Rejected',       badge: 'badge-rejected' },
  { key: 'ghosted',  label: 'Ghosted',        badge: 'badge-ghosted'  },
];

const statusMap = {};
STATUSES.forEach(s => statusMap[s.key] = s);

// ── DATA LAYER ─────────────────────────────────
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { apps: [] }; }
  catch { return { apps: [] }; }
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getApps() { return load().apps; }

function saveApp(app) {
  const data = load();
  const idx = data.apps.findIndex(a => a.id === app.id);
  if (idx >= 0) data.apps[idx] = app;
  else data.apps.push(app);
  persist(data);
}

function deleteApp(id) {
  const data = load();
  data.apps = data.apps.filter(a => a.id !== id);
  persist(data);
}

function makeApp(fields) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    company:     fields.company    || '',
    role:        fields.role       || '',
    dateApplied: fields.date       || new Date().toISOString().slice(0,10),
    url:         fields.url        || '',
    status:      fields.status     || 'applied',
    notes:       fields.notes      || '',
    createdAt:   new Date().toISOString(),
  };
}

// ── SORT STATE ─────────────────────────────────
let sortCol = 'dateApplied';
let sortDir = 'desc';
let filterText = '';
let filterStatus = '';
let editingId = null;

// ── RENDER ─────────────────────────────────────
function getStatusInfo(key) {
  return statusMap[key] || { key, label: key, badge: 'badge-applied' };
}

function renderStats() {
  const apps = getApps();
  const total    = apps.length;
  const inProg   = apps.filter(a => !['offer','rejected','ghosted'].includes(a.status)).length;
  const offers   = apps.filter(a => a.status === 'offer').length;
  const rejected = apps.filter(a => a.status === 'rejected').length;
  const rejRate  = total > 0 ? Math.round((rejected / total) * 100) : 0;

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-progress').textContent = inProg;
  document.getElementById('stat-offers').textContent   = offers;
  document.getElementById('stat-reject').textContent   = rejRate + '%';
}

function getFilteredSortedApps() {
  let apps = getApps();

  if (filterText) {
    const q = filterText.toLowerCase();
    apps = apps.filter(a =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );
  }

  if (filterStatus) {
    apps = apps.filter(a => a.status === filterStatus);
  }

  apps.sort((a, b) => {
    let va = a[sortCol] || '';
    let vb = b[sortCol] || '';
    if (sortCol === 'status') {
      va = STATUSES.findIndex(s => s.key === va);
      vb = STATUSES.findIndex(s => s.key === vb);
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  return apps;
}

function renderTable() {
  const apps = getFilteredSortedApps();
  const tbody = document.getElementById('app-tbody');

  // Update sort indicators
  document.querySelectorAll('thead th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) {
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  if (apps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <span class="emoji">📋</span>
            <p>No applications yet — add your first one above!</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const si = getStatusInfo(app.status);
    const urlHtml = app.url
      ? `<a href="${escHtml(app.url)}" target="_blank" rel="noopener">View</a>`
      : '<span style="color:#ccc">—</span>';

    return `
      <tr>
        <td class="company-cell">${escHtml(app.company)}</td>
        <td class="role-cell">${escHtml(app.role)}</td>
        <td class="date-cell">${app.dateApplied || '—'}</td>
        <td class="url-cell">${urlHtml}</td>
        <td><span class="badge ${si.badge}">${si.label}</span></td>
        <td class="role-cell" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(app.notes)}">${escHtml(app.notes || '—')}</td>
        <td class="actions-cell">
          <button class="btn btn-edit" onclick="openEdit('${app.id}')">Edit</button>
          <button class="btn btn-danger" onclick="confirmDelete('${app.id}','${escAttr(app.company)}')">Del</button>
        </td>
      </tr>`;
  }).join('');
}

function render() {
  renderStats();
  renderTable();
}

// ── SORT ───────────────────────────────────────
document.querySelectorAll('thead th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortCol = col; sortDir = 'asc'; }
    renderTable();
  });
});

// ── FILTER ─────────────────────────────────────
document.getElementById('filter-text').addEventListener('input', e => {
  filterText = e.target.value;
  renderTable();
});

document.getElementById('filter-status').addEventListener('change', e => {
  filterStatus = e.target.value;
  renderTable();
});

// ── QUICK PICKS ────────────────────────────────
QUICK_COMPANIES.forEach(name => {
  const btn = document.createElement('button');
  btn.className = 'quick-pick';
  btn.type = 'button';
  btn.textContent = name;
  btn.addEventListener('click', () => {
    document.getElementById('f-company').value = name;
  });
  document.getElementById('quick-picks').appendChild(btn);
});

// Custom button
const customBtn = document.createElement('button');
customBtn.className = 'quick-pick';
customBtn.type = 'button';
customBtn.textContent = 'Custom ✎';
customBtn.style.fontStyle = 'italic';
customBtn.addEventListener('click', () => {
  document.getElementById('f-company').focus();
  document.getElementById('f-company').value = '';
});
document.getElementById('quick-picks').appendChild(customBtn);

// ── ADD FORM ───────────────────────────────────
document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();

  const company = document.getElementById('f-company').value.trim();
  const role    = document.getElementById('f-role').value.trim();

  if (!company) { toast('Company name is required', 'error'); return; }
  if (!role)    { toast('Role is required', 'error'); return; }

  const app = makeApp({
    company,
    role,
    date:   document.getElementById('f-date').value,
    url:    document.getElementById('f-url').value.trim(),
    status: document.getElementById('f-status').value,
    notes:  document.getElementById('f-notes').value.trim(),
  });

  saveApp(app);
  document.getElementById('add-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().slice(0,10);
  toast('Application added!', 'success');
  render();
});

// Set default date
document.getElementById('f-date').value = new Date().toISOString().slice(0,10);

// ── EDIT MODAL ─────────────────────────────────
function openEdit(id) {
  const app = getApps().find(a => a.id === id);
  if (!app) return;
  editingId = id;

  document.getElementById('e-company').value = app.company;
  document.getElementById('e-role').value    = app.role;
  document.getElementById('e-date').value    = app.dateApplied || '';
  document.getElementById('e-url').value     = app.url || '';
  document.getElementById('e-status').value  = app.status;
  document.getElementById('e-notes').value   = app.notes || '';

  document.getElementById('edit-modal').classList.remove('hidden');
}

document.getElementById('edit-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!editingId) return;

  const data = load();
  const app  = data.apps.find(a => a.id === editingId);
  if (!app) return;

  app.company     = document.getElementById('e-company').value.trim();
  app.role        = document.getElementById('e-role').value.trim();
  app.dateApplied = document.getElementById('e-date').value;
  app.url         = document.getElementById('e-url').value.trim();
  app.status      = document.getElementById('e-status').value;
  app.notes       = document.getElementById('e-notes').value.trim();

  if (!app.company) { toast('Company name is required', 'error'); return; }

  persist(data);
  closeEditModal();
  toast('Application updated!', 'success');
  render();
});

document.getElementById('edit-cancel').addEventListener('click', closeEditModal);
document.getElementById('edit-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('edit-modal')) closeEditModal();
});

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
}

// ── DELETE CONFIRM ─────────────────────────────
let _deleteCb = null;

function confirmDelete(id, company) {
  document.getElementById('confirm-company').textContent = company;
  _deleteCb = () => {
    deleteApp(id);
    toast('Application deleted', 'error');
    render();
  };
  document.getElementById('confirm-modal').classList.remove('hidden');
}

document.getElementById('confirm-yes').addEventListener('click', () => {
  if (_deleteCb) _deleteCb();
  document.getElementById('confirm-modal').classList.add('hidden');
  _deleteCb = null;
});

document.getElementById('confirm-no').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  _deleteCb = null;
});

document.getElementById('confirm-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('confirm-modal')) {
    document.getElementById('confirm-modal').classList.add('hidden');
    _deleteCb = null;
  }
});

// ── EXPORT CSV ─────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const apps = getApps();
  if (!apps.length) { toast('No applications to export', 'error'); return; }

  const headers = ['Company','Role','Date Applied','URL','Status','Notes'];
  const rows = apps.map(a => [
    a.company, a.role, a.dateApplied, a.url,
    getStatusInfo(a.status).label,
    (a.notes || '').replace(/"/g, "'")
  ].map(v => `"${v || ''}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `faang-applications-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast(`Exported ${apps.length} applications`, 'success');
});

// ── TOAST ──────────────────────────────────────
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ` ${type}` : '');
  el.textContent = msg;
  document.getElementById('toast-wrap').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── HELPERS ────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function escAttr(str) {
  return String(str).replace(/'/g,'&#39;');
}

// ── INIT ───────────────────────────────────────
render();
