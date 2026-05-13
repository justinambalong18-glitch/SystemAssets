/**
 * School Asset Tracking System - Core Logic
 * SPA Navigation, State Management, and CRUD Operations
 */

// --- CORE SPA STATE ---
let currentUser = null;
let activeRole = 'admin';

// Data Store (Initialize from LocalStorage or Defaults)
let assets = JSON.parse(localStorage.getItem('assets')) || [
  {id:'AST-001',name:'Dell Laptop #12',cat:'IT Equipment',status:'Available',loc:'Room 201',date:'2024-01-10'},
  {id:'AST-002',name:'Projector #5',cat:'AV Equipment',status:'Borrowed',loc:'Lab 1',date:'2024-01-15'},
  {id:'AST-003',name:'Office Chair Set',cat:'Furniture',status:'Available',loc:'Staff Room',date:'2024-01-20'},
  {id:'AST-004',name:'Microscope #2',cat:'Lab Equipment',status:'Available',loc:'Sci Lab',date:'2024-02-10'},
];
let users = JSON.parse(localStorage.getItem('sysUsers')) || [
  {id:'USR-001',name:'System Admin',email:'admin@school.edu',role:'Admin',dept:'Administration',status:'Active'},
  {id:'USR-002',name:'Maria Santos',email:'msantos@school.edu',role:'Staff',dept:'Science Dept.',status:'Active'},
];
let categories = JSON.parse(localStorage.getItem('categories')) || [
  {name:'IT Equipment', icon:'💻', color:'#6366f1'},
  {name:'AV Equipment', icon:'📡', color:'#06b6d4'},
  {name:'Furniture', icon:'🪑', color:'#10b981'},
  {name:'Lab Equipment', icon:'🔬', color:'#f59e0b'}
];
let borrows = JSON.parse(localStorage.getItem('borrows')) || [];
let maintenance = JSON.parse(localStorage.getItem('maintenance')) || [];
let staffRequests = JSON.parse(localStorage.getItem('myRequests')) || [];

// Persist Helpers
function saveAll() {
  localStorage.setItem('assets', JSON.stringify(assets));
  localStorage.setItem('sysUsers', JSON.stringify(users));
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('borrows', JSON.stringify(borrows));
  localStorage.setItem('maintenance', JSON.stringify(maintenance));
  localStorage.setItem('myRequests', JSON.stringify(staffRequests));
}

// --- AUTH LOGIC ---
function setRole(role) {
  activeRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  const targetTab = document.querySelector(`.role-tab[data-role="${role}"]`);
  if (targetTab) targetTab.classList.add('active');
  
  const btn = document.getElementById('loginBtn');
  if (btn) {
    btn.className = `btn-login ${role}`;
    btn.textContent = `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
  }
  document.body.setAttribute('data-theme', role);
}

function handleLogin() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const err = document.getElementById('loginError');

  // Simple demo auth
  if ((activeRole === 'admin' && u === 'admin' && p === 'admin123') ||
      (activeRole === 'staff' && u === 'staff' && p === 'staff123')) {
    currentUser = { user: u, role: activeRole };
    sessionStorage.setItem('user', u);
    sessionStorage.setItem('role', activeRole);
    initApp();
  } else {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
}

function logout() {
  sessionStorage.clear();
  window.location.reload();
}

// --- NAVIGATION ---
function navigate(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.remove('active');
    const onclickAttr = i.getAttribute('onclick');
    if (onclickAttr && onclickAttr.includes(`'${pageId}'`)) i.classList.add('active');
  });

  const titles = {
    'dashboard': 'Dashboard Overview', 'assets': 'All Assets', 'categories': 'Asset Categories',
    'borrowing': 'Borrowing Logs', 'maintenance': 'Maintenance Tracker', 'reports': 'System Reports',
    'users': 'User Management', 'staff-dashboard': 'Staff Dashboard', 'browse': 'Browse Assets',
    'my-borrows': 'My Borrowings', 'requests': 'Asset Requests', 'report-issue': 'Report Issue'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[pageId] || 'SchoolAsset';

  // Load specific view data
  if (pageId === 'dashboard') updateAdminDashboard();
  if (pageId === 'assets') renderAssetsTable();
  if (pageId === 'categories') renderCategories();
  if (pageId === 'borrowing') renderBorrowingTable();
  if (pageId === 'maintenance') renderMaintTable();
  if (pageId === 'reports') renderReports();
  if (pageId === 'users') renderUsersGrid();
  if (pageId === 'staff-dashboard') updateStaffDashboard();
  if (pageId === 'browse') renderBrowseGrid();
  if (pageId === 'my-borrows') renderMyBorrows();
  if (pageId === 'requests') renderStaffRequests();
}

// --- APP INITIALIZATION ---
function initApp() {
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  
  if (loginView) loginView.style.display = 'none';
  if (appView) appView.style.display = 'flex';
  
  const role = sessionStorage.getItem('role');
  const user = sessionStorage.getItem('user');
  
  document.body.setAttribute('data-theme', role);
  
  const uNameEl = document.getElementById('uNameDisplay');
  if (uNameEl) uNameEl.textContent = user;
  
  const roleBadge = document.getElementById('sidebarRoleBadge');
  if (roleBadge) roleBadge.textContent = role === 'admin' ? '👑 Admin Panel' : '🧑‍💼 Staff Panel';
  
  const avatar = document.getElementById('userAvatar');
  if (avatar) avatar.textContent = role === 'admin' ? '👑' : '🧑‍💼';

  if (role === 'admin') {
    document.getElementById('nav-admin').style.display = 'block';
    document.getElementById('nav-staff').style.display = 'none';
    navigate('dashboard');
  } else {
    document.getElementById('nav-admin').style.display = 'none';
    document.getElementById('nav-staff').style.display = 'block';
    const greet = document.getElementById('staffGreetName');
    if (greet) greet.textContent = user.charAt(0).toUpperCase() + user.slice(1);
    navigate('staff-dashboard');
  }
}

// --- DATA RENDERING (ADMIN) ---
function updateAdminDashboard() {
  const total = document.getElementById('statTotalAssets');
  const avail = document.getElementById('statAvailAssets');
  const borrowed = document.getElementById('statBorrowedAssets');
  
  if (total) total.textContent = assets.length;
  if (avail) avail.textContent = assets.filter(a => a.status === 'Available').length;
  if (borrowed) borrowed.textContent = assets.filter(a => a.status === 'Borrowed').length;
}

function renderAssetsTable() {
  const qEl = document.getElementById('assetSearch');
  const stEl = document.getElementById('assetFilterStatus');
  if (!qEl || !stEl) return;

  const q = qEl.value.toLowerCase();
  const st = stEl.value;
  const data = assets.filter(a => (!q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) && (!st || a.status === st));
  
  const tbody = document.getElementById('assetTableBody');
  if (tbody) {
    tbody.innerHTML = data.map(a => `
      <tr>
        <td><code style="color:var(--accent2)">${a.id}</code></td>
        <td><b>${a.name}</b></td><td>${a.cat}</td>
        <td><span class="status-badge ${a.status === 'Available' ? 's-available' : 's-borrowed'}">${a.status}</span></td>
        <td>${a.loc}</td>
        <td><div class="actions"><button class="icon-btn" onclick="deleteAsset('${a.id}')">🗑️</button></div></td>
      </tr>`).join('');
  }
}

function deleteAsset(id) {
  if (confirm('Are you sure you want to delete this asset?')) {
    assets = assets.filter(a => a.id !== id);
    saveAll();
    renderAssetsTable();
    showToast('Asset deleted successfully');
  }
}

function renderCategories() {
  const grid = document.getElementById('catGrid');
  if (grid) {
    grid.innerHTML = categories.map(c => `
      <div class="panel" style="border-left: 4px solid ${c.color}">
        <div style="font-size: 32px; margin-bottom: 12px;">${c.icon}</div>
        <div class="panel-title">${c.name}</div>
        <div class="user-meta">${assets.filter(a => a.cat === c.name).length} assets</div>
      </div>`).join('');
  }
}

function renderBorrowingTable() {
  const tbody = document.getElementById('borrowTableBody');
  if (tbody) {
    tbody.innerHTML = borrows.map(b => `
      <tr>
        <td><code>${b.id}</code></td><td><b>${b.asset}</b></td><td>${b.borrower}</td>
        <td>${b.ddate}</td><td><span class="status-badge s-borrowed">${b.status}</span></td>
        <td><button class="btn-sm" onclick="markReturned('${b.id}')">✅ Return</button></td>
      </tr>`).join('');
  }
}

function markReturned(id) {
  const b = borrows.find(x => x.id === id);
  if (b) {
    const a = assets.find(x => x.name === b.asset);
    if (a) a.status = 'Available';
    borrows = borrows.filter(x => x.id !== id);
    saveAll();
    renderBorrowingTable();
    showToast('Asset marked as returned');
  }
}

function renderMaintTable() {
  const tbody = document.getElementById('maintTableBody');
  if (tbody) {
    tbody.innerHTML = maintenance.map(m => `
      <tr>
        <td><code>${m.id}</code></td><td><b>${m.asset}</b></td><td>${m.issue}</td>
        <td><span class="status-badge">${m.status}</span></td><td>${m.tech}</td>
        <td><button class="btn-sm" onclick="completeMaint('${m.id}')">✅ Done</button></td>
      </tr>`).join('');
  }
}

function completeMaint(id) {
  maintenance = maintenance.filter(m => m.id !== id);
  saveAll();
  renderMaintTable();
  showToast('Maintenance task completed');
}

function renderReports() {
  const summary = document.getElementById('reportSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="summary-card"><h3>${assets.length}</h3><p>Total</p></div>
      <div class="summary-card" style="color:var(--accent)"><h3>${assets.filter(a => a.status === 'Available').length}</h3><p>Avail</p></div>
      <div class="summary-card" style="color:var(--yellow)"><h3>${borrows.length}</h3><p>Active Borrows</p></div>
      <div class="summary-card" style="color:var(--red)"><h3>${maintenance.length}</h3><p>Repair</p></div>`;
  }
}

function renderUsersGrid() {
  const grid = document.getElementById('usersGrid');
  if (grid) {
    grid.innerHTML = users.map(u => `
      <div class="user-card">
        <div class="user-avatar ${u.role === 'Admin' ? 'ua-admin' : 'ua-staff'}">${u.role === 'Admin' ? '👑' : '🧑‍💼'}</div>
        <div class="user-name">${u.name}</div>
        <div class="user-role ${u.role === 'Admin' ? 'r-admin' : 'r-staff'}">${u.role}</div>
        <div class="user-meta">📁 ${u.dept}</div>
      </div>`).join('');
  }
}

// --- STAFF LOGIC ---
function updateStaffDashboard() {
  const borrowCount = document.getElementById('sStatBorrow');
  if (borrowCount) {
    borrowCount.textContent = borrows.filter(b => b.borrower === sessionStorage.getItem('user')).length;
  }
}

function renderBrowseGrid() {
  const grid = document.getElementById('browseGrid');
  if (grid) {
    grid.innerHTML = assets.map(a => `
      <div class="panel">
        <div class="user-meta">${a.id}</div>
        <div class="panel-title">${a.name}</div>
        <div class="user-meta">📁 ${a.cat}</div>
        <div style="margin-top: 16px; display:flex; justify-content:space-between; align-items:center;">
          <span class="status-badge ${a.status === 'Available' ? 's-available' : 's-borrowed'}">${a.status}</span>
          <button class="btn-sm" ${a.status !== 'Available' ? 'disabled' : ''} onclick="quickBorrow('${a.id}')">Borrow</button>
        </div>
      </div>`).join('');
    
    const sel = document.getElementById('browseCatFilter');
    if (sel && sel.options.length <= 1) {
      categories.forEach(c => sel.add(new Option(c.name, c.name)));
    }
  }
}

function quickBorrow(id) {
  const a = assets.find(x => x.id === id);
  if (a) {
    a.status = 'Borrowed';
    borrows.push({
      id: 'BRW-' + (borrows.length + 1).toString().padStart(3, '0'),
      asset: a.name,
      borrower: sessionStorage.getItem('user'),
      ddate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'Active'
    });
    saveAll();
    showToast(`Borrowed ${a.name}!`);
    renderBrowseGrid();
  }
}

function renderMyBorrows() {
  const data = borrows.filter(b => b.borrower === sessionStorage.getItem('user'));
  const tbody = document.getElementById('myBorrowsTableBody');
  if (tbody) {
    tbody.innerHTML = data.map(b => `
      <tr>
        <td><code>${b.id}</code></td><td><b>${b.asset}</b></td><td>${b.ddate}</td>
        <td><span class="status-badge s-borrowed">${b.status}</span></td>
        <td><button class="btn-sm" onclick="returnItem('${b.id}')">Return</button></td>
      </tr>`).join('');
  }
}

function returnItem(id) {
  const bIdx = borrows.findIndex(x => x.id === id);
  if (bIdx > -1) {
    const a = assets.find(x => x.name === borrows[bIdx].asset);
    if (a) a.status = 'Available';
    borrows.splice(bIdx, 1);
    saveAll();
    renderMyBorrows();
    showToast('Item returned.');
  }
}

function renderStaffRequests() {
  const list = document.getElementById('staffRequestsList');
  if (list) {
    list.innerHTML = staffRequests.slice(-5).reverse().map(r => `
      <div class="user-meta" style="margin-bottom:12px; padding:10px; background:var(--surface2); border-radius:8px;">
        <b>${r.asset}</b><br>${r.date} — <span style="color:var(--yellow)">${r.status}</span>
      </div>`).join('') || '<p>No requests yet.</p>';
  }
}

function submitStaffRequest() {
  const asset = document.getElementById('reqAsset').value;
  if (!asset) return alert('Enter asset name');
  staffRequests.push({ asset, date: new Date().toISOString().slice(0, 10), status: 'Pending' });
  saveAll();
  document.getElementById('reqAsset').value = '';
  renderStaffRequests();
  showToast('Request submitted!');
}

function submitStaffIssue() {
  const asset = document.getElementById('issueAsset').value;
  const desc = document.getElementById('issueDesc').value;
  if (!asset || !desc) return alert('Fill all fields');
  
  maintenance.push({
    id: 'MNT-' + (maintenance.length + 1).toString().padStart(3, '0'),
    asset: asset,
    issue: desc,
    status: 'Pending',
    tech: 'Unassigned'
  });
  saveAll();
  document.getElementById('issueDesc').value = '';
  showToast('Issue reported to Admin');
}

// --- MODAL & HELPERS ---
function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

function closeModal() { 
  const modal = document.getElementById('globalModal');
  if (modal) modal.classList.remove('open'); 
}

// --- EXPORT ---
function exportCSV() {
  const csv = ['Asset Name,Category,Status,Location', ...assets.map(a => `${a.name},${a.cat},${a.status},${a.loc}`)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'asset-report.csv';
  a.click();
}

// Init check
if (sessionStorage.getItem('role')) initApp();
setRole('admin'); // Default role view on login
