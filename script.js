/* ======================================================== */
/* 💻 script.js (KODE GABUNGAN: USER & ADMIN LOGIC)         */
/* ======================================================== */

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBDJO_Lsro9IpkXU1ducHRwZHKc5kH6GVQ",
    authDomain: "pemesan-makanan-online.firebaseapp.com",
    projectId: "pemesan-makanan-online",
    storageBucket: "pemesan-makanan-online.firebasestorage.app",
    messagingSenderId: "248955086378",
    appId: "1:248955086378:web:c989826a8a78d0c9dfc553",
    measurementId: "G-E2XHCSEWEC",
    databaseURL: "https://pemesan-makanan-online-default-rtdb.asia-southeast1.firebasedatabase.app"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();
const db = database; // Alias untuk kode admin
let menuCache = {}; // Cache untuk admin

// --- 2. GLOBAL VARIABLES (USER) ---
let menuData = [];
let cart = [];
let currentCategory = 'all';
let currentUser = null;

// --- 3. INIT LOGIC (Deteksi Halaman) ---
window.onload = function() {
    const path = window.location.pathname;
    // Deteksi mode berdasarkan nama file
    if (path.includes('admin.html')) {
        initAdminMode();
    } else {
        initUserMode();
    }
};

/* ======================================================== */
/* FUNGSI USER MODE (INDEX.HTML)                            */
/* ======================================================== */

function initUserMode() {
    checkSession();
    fetchMenuFromFirebase();
    // Expose fungsi global untuk HTML
    window.checkSession = checkSession;
    window.fetchMenuFromFirebase = fetchMenuFromFirebase;
    window.renderMenu = renderMenu;
    window.filterCategory = filterCategory;
    window.filterMenu = filterMenu;
    window.addToCart = addToCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.confirmOrder = confirmOrder;
    window.closeTracking = closeTracking;
    window.checkActiveOrder = checkActiveOrder;
    window.openTrackingStatus = openTrackingStatus;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.handleLogout = handleLogout;
    window.toggleUserMenu = toggleUserMenu;
    window.showLogin = showLogin;
    window.showRegister = showRegister;
    window.closeAuth = closeAuth;
    window.openProfile = openProfile;
    window.closeProfile = closeProfile;
    window.openHistoryModal = openHistoryModal;
    window.closeHistoryModal = closeHistoryModal;
}

// --- 4. MENU LOGIC ---
function fetchMenuFromFirebase() {
    const menuRef = database.ref('menu_items');
    menuRef.on('value', (snapshot) => {
        const data = snapshot.val();
        menuData = []; 
        const grid = document.getElementById('menuGrid');
        
        if (data) {
            Object.keys(data).forEach(key => {
                menuData.push({ id: key, ...data[key] });
            });
            renderMenu();
        } else {
            if(grid) grid.innerHTML = '<div class="empty-state">Belum ada menu tersedia.</div>';
        }
    });
}

function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return; 

    const termInput = document.getElementById('searchInput');
    const term = termInput ? termInput.value.toLowerCase() : '';
    
    const filtered = menuData.filter(item => {
        const matchCat = currentCategory === 'all' || item.category === currentCategory;
        const matchSearch = (item.name && item.name.toLowerCase().includes(term)) || (item.description && item.description.toLowerCase().includes(term));
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Menu tidak ditemukan 😢</div>';
        return;
    }

    grid.innerHTML = filtered.map(item => {
        let imageHTML = '';
        if (item.image && (item.image.startsWith('data:image') || item.image.startsWith('http'))) {
            imageHTML = `<img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            imageHTML = item.image || '🍽️';
        }

        return `
        <div class="menu-card">
            <div class="menu-img">${imageHTML}</div>
            <div class="menu-content">
                <h3 class="menu-title">${item.name}</h3>
                <p class="menu-desc">${item.description || 'Tanpa deskripsi'}</p>
                <div class="menu-meta">
                    <div class="rating">★ ${item.rating || 5.0}</div>
                    <div>🕒 ${item.deliveryTime || '20m'}</div>
                </div>
                <div class="menu-footer">
                    <div class="price">Rp ${item.price ? item.price.toLocaleString('id-ID') : 0}</div>
                    <button class="btn btn-sm btn-primary" onclick="addToCart('${item.id}')">+ Tambah</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const buttons = document.querySelectorAll('.chip');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(`'${cat}'`)) btn.classList.add('active');
    });
    renderMenu();
}
function filterMenu() { renderMenu(); }

// --- 5. CART LOGIC ---
function addToCart(id) {
    const item = menuData.find(m => m.id === id);
    if (!item) return;
    const exist = cart.find(c => c.id === id);
    if(exist) exist.quantity++; else cart.push({...item, quantity: 1});
    updateCartUI();
    showNotification(`✅ ${item.name} masuk keranjang!`);
}

function updateQuantity(id, change) {
    const item = cart.find(c => c.id === id);
    if(item) {
        item.quantity += change;
        if(item.quantity <= 0) cart = cart.filter(c => c.id !== id);
        updateCartUI(); 
        renderCartList(); 
    }
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) cartBadge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
}

function openCart() { 
    renderCartList(); 
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.classList.add('active'); 
}

function closeCart() { 
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.classList.remove('active'); 
}

function renderCartList() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    if (!container || !summary) return;
    
    if(cart.length === 0) {
        container.innerHTML = '<div class="empty-state">Keranjang kosong 🛒</div>';
        summary.style.display = 'none'; 
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
        </div>`).join('');
    
    const subtotal = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
    const shipping = 10000;
    const total = subtotal + shipping;
    
    if (document.getElementById('subtotal')) document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    if (document.getElementById('totalPrice')) document.getElementById('totalPrice').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    summary.style.display = 'block';
}

function checkout() {
    if(!currentUser) {
        closeCart(); showNotification('🔒 Login dulu untuk pesan');
        setTimeout(() => {
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.add('active');
        }, 500);
        return;
    }
    const container = document.getElementById('cartItems');
    if (!container) return;

    container.innerHTML = `<div style="padding:15px; background:var(--color-bg); border-radius:12px; border:1px solid var(--color-border);">
        <h4 style="color:var(--color-primary); margin-bottom:10px;">📦 Detail Pengiriman</h4>
        <div class="form-group"><label class="form-label">Penerima</label><input type="text" class="search-input" value="${currentUser.name || ''}" readonly></div>
        <div class="form-group"><label class="form-label">Alamat</label><textarea class="search-input" rows="2" readonly>${currentUser.address || ''}</textarea></div>
    </div>`;
    
    const finalTotal = cart.reduce((s,i) => s + (i.price * i.quantity), 0) + 10000;
    const cartSummary = document.getElementById('cartSummary');
    if (cartSummary) {
        cartSummary.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin-bottom: 16px;">
                <span>Total Bayar</span>
                <span id="finalTotal">Rp ${finalTotal.toLocaleString('id-ID')}</span>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="confirmOrder()">🚀 Kirim Pesanan</button>`;
    }
}

function confirmOrder() {
    const total = cart.reduce((s,i) => s + (i.price * i.quantity), 0) + 10000;
    const newOrder = {
        buyerName: currentUser.name,
        buyerPhone: currentUser.phone || '-',
        address: currentUser.address,
        items: cart,
        total: total,
        status: 'Menunggu Konfirmasi',
        timestamp: Date.now(),
        dateReadable: new Date().toLocaleString()
    };

    database.ref('orders').push(newOrder).then(() => {
        let orderHistory = JSON.parse(localStorage.getItem('food_delivery_orders') || '[]');
        orderHistory.push(newOrder);
        localStorage.setItem('food_delivery_orders', JSON.stringify(orderHistory));
        cart = []; updateCartUI(); closeCart();
        
        checkActiveOrder(); 
        
        const trackingModal = document.getElementById('trackingModal');
        if (trackingModal) trackingModal.classList.add('active');
        showNotification('🎉 Pesanan Terkirim!');
    }).catch(err => showNotification('❌ Gagal kirim pesanan.'));
}
function closeTracking() { 
    const trackingModal = document.getElementById('trackingModal');
    if (trackingModal) trackingModal.classList.remove('active'); 
}

// --- 6. ORDER TRACKING LOGIC ---
function checkActiveOrder() {
    const trackingBtn = document.getElementById('trackingBtn');
    if (!trackingBtn) return;
    trackingBtn.style.display = 'none'; 
    if (!currentUser) return;

    database.ref('orders')
        .orderByChild('buyerName')
        .equalTo(currentUser.name)
        .on('value', (snapshot) => { 
            const data = snapshot.val();
            if (data) {
                const hasActive = Object.values(data).some(o => o.status !== 'Selesai');
                if (hasActive) {
                    trackingBtn.style.display = 'flex'; 
                } else {
                    trackingBtn.style.display = 'none';
                }
            } else {
                trackingBtn.style.display = 'none';
            }
        });
}

function openTrackingStatus() {
    if (!currentUser) return;
    
    showNotification('🔄 Memuat status pesanan...');
    
    database.ref('orders')
        .orderByChild('buyerName')
        .equalTo(currentUser.name)
        .once('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                showNotification('❌ Tidak ada pesanan aktif.');
                return;
            }

            const activeOrders = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(o => o.status !== 'Selesai')
                .sort((a, b) => b.timestamp - a.timestamp); 

            if (activeOrders.length > 0) {
                const latestOrder = activeOrders[0];
                renderTrackingModal(latestOrder);
                const trackingModal = document.getElementById('trackingModal');
                if (trackingModal) trackingModal.classList.add('active');
            } else {
                showNotification('✅ Semua pesanan sudah selesai atau belum ada pesanan aktif.');
            }
        });
}

function renderTrackingModal(order) {
    const modalBody = document.querySelector('#trackingModal .modal-body');
    if (!modalBody) return;
    const status = order.status;

    const steps = [
        { name: 'Pesanan Diterima', detail: 'Restoran sedang menyiapkan', triggers: ['Menunggu Konfirmasi', 'Diproses', 'Sedang Diantar', 'Selesai'] },
        { name: 'Driver Menjemput', detail: 'Driver menuju resto / sedang menyiapkan', triggers: ['Diproses', 'Sedang Diantar', 'Selesai'] },
        { name: 'Sedang Diantar', detail: 'Estimasi tiba: 15 menit', triggers: ['Sedang Diantar', 'Selesai'] },
        { name: 'Pesanan Selesai', detail: 'Terima kasih telah memesan!', triggers: ['Selesai'] }
    ];

    let stepsHTML = steps.map(step => {
        const isCompleted = step.triggers.includes(status);
        const icon = isCompleted ? '✓' : '○';
        const classList = isCompleted ? 'completed' : '';

        return `
            <div class="tracking-step ${classList}">
                <div class="tracking-icon">${icon}</div>
                <div>
                    <div style="font-weight: 600;">${step.name}</div>
                    <div style="font-size: 0.9rem; color: var(--color-text-light);">${step.detail}</div>
                </div>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <div style="margin-bottom: 20px; padding: 10px; background: var(--color-bg); border-radius: 8px;">
            <div style="font-size: 0.9rem; color: var(--color-text-light);">No. Pesanan: ${order.id}</div>
            <div style="font-weight: bold; color: var(--color-primary);">Status Saat Ini: ${status}</div>
            <div style="font-weight: bold; color: var(--color-primary);">Total: Rp ${order.total.toLocaleString('id-ID')}</div>
        </div>
        ${stepsHTML}
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn btn-secondary" onclick="closeTracking()">Tutup</button>
        </div>
    `;
    const modalTitle = document.querySelector('#trackingModal .modal-title');
    if (modalTitle) modalTitle.textContent = `Lacak Pesanan`;
}

// --- 7. AUTHENTICATION LOGIC ---
function checkSession() {
    const saved = localStorage.getItem('food_delivery_user_session');
    if(saved) {
        currentUser = JSON.parse(saved);
        checkActiveOrder(); 
    }
    updateAuthUI();
}

function updateAuthUI() {
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) historyBtn.style.display = 'none';
    
    const userDisplay = document.getElementById('userDisplay');
    const userBtn = document.getElementById('userBtn');
    
    if(currentUser) {
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.remove('active');

        if (userDisplay) userDisplay.textContent = `👤 ${currentUser.name ? currentUser.name.split(' ')[0] : 'User'}`;
        if (userBtn) userBtn.className = 'btn btn-primary';
        
        if (historyBtn) historyBtn.style.display = 'flex'; 

    } else {
        if (userDisplay) userDisplay.textContent = `👤 Login`;
        if (userBtn) userBtn.className = 'btn btn-secondary';
    }
}

function toggleUserMenu() {
    if (currentUser) {
        openProfile();
    } else {
        showLogin();
    }
}

function showLogin() {
    const authModal = document.getElementById('authModal');
    const authTitle = document.getElementById('authTitle');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (authModal) authModal.classList.add('active');
    
    if (authTitle) authTitle.textContent = 'Login';
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
}

function showRegister() {
    const authModal = document.getElementById('authModal');
    const authTitle = document.getElementById('authTitle');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (authModal) authModal.classList.add('active');

    if (authTitle) authTitle.textContent = 'Daftar Akun Baru';
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
}

function closeAuth() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');
}

function handleLogin() {
    const input = document.getElementById('loginInput').value.trim();
    const pass = document.getElementById('loginPassword').value;

    if(input === 'admin' && pass === '12345') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        window.location.href = 'admin.html';
        return;
    }

    showNotification('🔄 Memeriksa akun...');
    
    database.ref('users').orderByChild('email').equalTo(input).once('value').then(snap => {
        if(snap.exists()) validateUser(snap, pass);
        else {
            database.ref('users').orderByChild('username').equalTo(input).once('value').then(snap2 => {
                if(snap2.exists()) validateUser(snap2, pass);
                else showNotification('❌ Akun tidak ditemukan.');
            });
        }
    });
}

function validateUser(snapshot, password) {
    let foundUser = null;
    snapshot.forEach(child => { foundUser = child.val(); });
    if(foundUser && foundUser.password === password) {
        currentUser = foundUser;
        localStorage.setItem('food_delivery_user_session', JSON.stringify(currentUser));
        updateAuthUI();
        checkActiveOrder(); 
        showNotification(`✅ Berhasil Masuk!`);
        closeAuth();
    } else {
        showNotification('❌ Password Salah!');
    }
}

function handleRegister() {
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    const address = document.getElementById('regAddress').value;

    if(name && username && email && phone && pass && address) {
        const newUser = { name, username, email, phone, password: pass, address };
        database.ref('users').push(newUser).then(() => {
            currentUser = newUser;
            localStorage.setItem('food_delivery_user_session', JSON.stringify(currentUser));
            updateAuthUI();
            checkActiveOrder(); 
            showNotification('✅ Akun Berhasil Dibuat!');
            closeAuth();
        }).catch(err => showNotification('❌ Gagal mendaftar.'));
    } else { showNotification('❌ Data belum lengkap.'); }
}

function handleLogout() {
    if(!confirm('Keluar akun?')) return;
    localStorage.removeItem('food_delivery_user_session');
    sessionStorage.removeItem('isAdminLoggedIn');
    currentUser = null;
    cart = []; 
    closeProfile();
    updateCartUI();
    updateAuthUI();
    showNotification('👋 Logout Berhasil');
    setTimeout(() => window.location.reload(), 1000);
}

// --- 8. MODAL HANDLER (USER) ---
function openHistoryModal() {
    if (!currentUser) return;
    closeProfile(); 
    
    const historyModal = document.getElementById('historyModal');
    if (historyModal) historyModal.classList.add('active');
    
    const historyListContent = document.getElementById('historyListContent');
    if (historyListContent) historyListContent.innerHTML = '<div class="empty-state" style="padding: 20px;">🔄 Sedang memuat data dari server...</div>';
    
    renderOrderHistory(); 
}
function closeHistoryModal() {
    const historyModal = document.getElementById('historyModal');
    if (historyModal) historyModal.classList.remove('active');
}

function renderOrderHistory() {
    if (!currentUser || !currentUser.name) {
        const historyListContent = document.getElementById('historyListContent');
        if (historyListContent) historyListContent.innerHTML = '<div class="empty-state" style="padding: 20px;">⚠️ Akun tidak teridentifikasi.</div>';
        return;
    }
    
    const historyContainer = document.getElementById('historyListContent');
    if (!historyContainer) return;
    
    database.ref('orders')
        .orderByChild('buyerName')
        .equalTo(currentUser.name)
        .once('value', (snapshot) => {
            const data = snapshot.val();
            
            if (!data) {
                historyContainer.innerHTML = '<div class="empty-state" style="padding: 20px;">Tidak ada riwayat pesanan.</div>';
                return;
            }
            
            const history = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            const sortedHistory = history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 
            
            let historyHTML = '';

            sortedHistory.forEach((order) => {
                let statusColor = 'var(--color-primary)';
                if (order.status === 'Selesai') {
                    statusColor = 'var(--color-secondary)';
                } else if (order.status === 'Diproses' || order.status === 'Sedang Diantar') {
                    statusColor = 'var(--color-accent)'; 
                } else if (order.status === 'Menunggu Konfirmasi') {
                    statusColor = 'var(--color-danger)'; 
                }

                const items = order.items || [];
                const itemNames = items.slice(0, 3).map(i => `${i.quantity || 1}x ${i.name || 'Item Tak Dikenal'}`).join(', ') + 
                                  (items.length > 3 ? ` dan ${items.length - 3} lainnya` : '');

                historyHTML += `
                    <div style="padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 10px; background: var(--color-bg);">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                            <span style="font-weight: bold;">${order.dateReadable ? order.dateReadable.split(',')[0] : 'Tanggal Tidak Diketahui'}</span>
                            <span style="color: ${statusColor}; font-weight: bold;">${order.status || 'Status Tidak Diketahui'}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--color-text-light); margin-bottom: 5px;">
                            ${itemNames}
                        </div>
                        <div style="font-weight: 800; color: var(--color-primary);">
                            Total: Rp ${(order.total || 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                `;
            });
            
            historyContainer.innerHTML = historyHTML;
            
        }).catch(err => {
            console.error("Firebase fetch error:", err);
            historyContainer.innerHTML = '<div class="empty-state" style="padding: 20px;">❌ Gagal memuat riwayat dari server.</div>';
        });
}

function openProfile() {
    if (!currentUser) return;
    try {
        const profileModal = document.getElementById('profileModal');
        if (!profileModal) return showNotification('❌ Modal Profil tidak ditemukan di HTML.');
        
        if (document.getElementById('profileName')) document.getElementById('profileName').textContent = currentUser.name || 'Pengguna';
        if (document.getElementById('profileUsername')) document.getElementById('profileUsername').textContent = '@' + (currentUser.username || '-');
        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = currentUser.email || '-';
        if (document.getElementById('profilePhone')) document.getElementById('profilePhone').textContent = currentUser.phone || '-';
        if (document.getElementById('profileAddress')) document.getElementById('profileAddress').textContent = currentUser.address || 'Alamat Belum Disimpan';

        profileModal.classList.add('active');
        
    } catch (e) { 
        console.error("DEBUG: Fatal Error saat memuat openProfile:", e); 
        showNotification('❌ GAGAL MEMUAT PROFIL! Data sesi mungkin rusak. Coba Logout & Login lagi.');
    }
}

function closeProfile() { 
    const profileModal = document.getElementById('profileModal');
    if (profileModal) profileModal.classList.remove('active'); 
}

function showNotification(msg) {
    const note = document.createElement('div');
    note.textContent = msg;
    note.style.cssText = "position:fixed; top:20px; right:20px; background:#4b5563; color:white; padding:12px 24px; border-radius:8px; z-index:9999; animation: slideIn 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
    document.body.appendChild(note);
    setTimeout(() => { if(note.parentNode) note.parentNode.removeChild(note); }, 3000);
}

window.onclick = function(e) {
    if(e.target.classList.contains('modal')) {
        if(e.target.id === 'authModal') return; 
        e.target.classList.remove('active');
    }
}

/* ======================================================== */
/* FUNGSI ADMIN MODE (ADMIN.HTML)                        */
/* ======================================================== */

function initAdminMode() {
    checkAdminSession();
    // Expose fungsi global untuk admin.html
    window.adminLogin = adminLogin;
    window.adminLogout = adminLogout;
    window.switchTab = switchTab;
    window.toggleInput = toggleInput;
    window.addMenu = addMenu;
    window.delMenu = delMenu;
    window.openEditModal = openEditModal;
    window.closeEditModal = closeEditModal;
    window.saveEditMenu = saveEditMenu;
    window.updStatus = updStatus;
    window.delOrder = delOrder;
}

function checkAdminSession() {
    if(sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        if(document.getElementById('loginOverlay')) document.getElementById('loginOverlay').style.display = 'none';
        if(document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'block';
        initAdminListeners();
    }
}

function initAdminListeners() {
    listenOrders();
    listenMenu();
    switchTab('orders'); // Default tab: Pesanan Aktif
}

// --- ADMIN LOGIN & LOGOUT ---
function adminLogin() {
    const u = document.getElementById('admUser').value;
    const p = document.getElementById('admPass').value;
    const errMsg = document.getElementById('errMsg');
    
    if(u === 'admin' && p === '12345') {
        sessionStorage.setItem('isAdminLoggedIn', 'true'); 
        window.location.href = 'admin.html';
    } else {
        if (errMsg) {
            errMsg.style.display = 'block';
            setTimeout(() => errMsg.style.display = 'none', 3000);
        }
    }
}

function adminLogout() {
    sessionStorage.removeItem('isAdminLoggedIn'); 
    window.location.href = 'index.html'; 
}

// --- ADMIN NAVIGASI & UTILS ---
function switchTab(tab) {
    const tabOrders = document.getElementById('tabOrders');
    const tabHistory = document.getElementById('tabHistory'); // Tab Riwayat Selesai
    const tabAdd = document.getElementById('tabAdd');
    const tabManage = document.getElementById('tabManage');

    if(tabOrders) tabOrders.style.display = 'none';
    if(tabHistory) tabHistory.style.display = 'none';
    if(tabAdd) tabAdd.style.display = 'none';
    if(tabManage) tabManage.style.display = 'none';
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    let buttonIndex = -1;
    let targetTab = null;

    if(tab === 'orders') {
        targetTab = tabOrders;
        buttonIndex = 0;
    } else if(tab === 'history') { 
        targetTab = tabHistory;
        buttonIndex = 1;
    } else if(tab === 'add') {
        targetTab = tabAdd;
        buttonIndex = 2;
    } else if (tab === 'manage') {
        targetTab = tabManage;
        buttonIndex = 3;
    }

    if (targetTab) targetTab.style.display = 'block';
    if (buttonIndex !== -1 && document.querySelectorAll('.tab-btn')[buttonIndex]) {
        document.querySelectorAll('.tab-btn')[buttonIndex].classList.add('active');
    }
}

function toggleInput(type, mode) {
    const fileGroup = document.getElementById('inputGroupFile'+mode);
    const emojiGroup = document.getElementById('inputGroupEmoji'+mode);
    if(fileGroup) fileGroup.style.display = (type === 'file') ? 'block' : 'none';
    if(emojiGroup) emojiGroup.style.display = (type === 'emoji') ? 'block' : 'none';
}


// --- 6. ADMIN ORDER MANAGEMENT (DIPISAHKAN DI TAB BERBEDA) ---
function listenOrders() {
    db.ref('orders').on('value', snap => {
        const data = snap.val();
        
        // Kontainer Tab Pesanan Aktif
        const activeDiv = document.getElementById('ordersListActive');
        // Kontainer Tab Riwayat Selesai
        const completedDiv = document.getElementById('ordersListCompleted'); 
        
        if(activeDiv) activeDiv.innerHTML = '';
        if(completedDiv) completedDiv.innerHTML = '';
        
        let activeOrdersCount = 0;
        let completedOrdersCount = 0;
        
        if(data) {
            const orders = Object.keys(data).map(k => ({id: k, ...data[k]})).reverse();
            
            let activeHTML = '';
            let completedHTML = '';

            orders.forEach(o => {
                const isCompleted = o.status === 'Selesai';
                
                let items = (o.items || []).map(i => `<div>${i.quantity || i.qty}x ${i.name}</div>`).join('');
                
                // --- Logic Styling Status ---
                let statusStyle = `background:#FFC107; color:#333; border: 1px solid #FFC107;`;
                let cardBorderColor = '#FFC107';

                if(o.status === 'Diproses' || o.status === 'Sedang Diantar') {
                    statusStyle = `background:var(--color-primary); color:var(--color-text); border: 1px solid var(--color-primary);`; 
                    cardBorderColor = 'var(--color-primary)';
                }
                if(o.status === 'Selesai') {
                    statusStyle = `background:var(--color-secondary); color:var(--color-text); border: 1px solid var(--color-secondary);`;
                    cardBorderColor = 'var(--color-secondary)';
                }
                // --- End Styling ---

                const orderCardHTML = `
                    <div class="order-card" style="border-left-color: ${cardBorderColor};">
                        <div class="order-header">
                            <div>
                                <div style="font-weight:bold; color:var(--color-text); font-size:1.1rem;">${o.buyerName}</div>
                                <div style="font-size:0.8rem; color:var(--color-text-light);">${o.dateReadable || 'Baru saja'}</div>
                                <div style="font-size:0.9rem; color:var(--color-text-light); margin-top:5px;">📍 ${o.address}</div>
                            </div>
                            <div class="order-status" style="${statusStyle}">${o.status}</div>
                        </div>
                        <div style="margin-bottom:15px; color:var(--color-text); border-bottom:1px dashed var(--color-border); padding-bottom:10px;">
                            ${items}
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-weight:800; color:var(--color-primary); font-size:1.3rem;">Rp ${o.total ? o.total.toLocaleString('id-ID') : 0}</div>
                            <div class="manage-actions">
                                ${!isCompleted ? 
                                    (o.status === 'Menunggu Konfirmasi' ? `<button class="btn btn-primary btn-sm" onclick="updStatus('${o.id}','Diproses')">Terima</button>` : '') +
                                    (o.status !== 'Selesai' ? `<button class="btn btn-secondary btn-sm" onclick="updStatus('${o.id}','Selesai')">Selesai</button>` : '')
                                    : 
                                    `<button class="btn btn-danger btn-sm" onclick="delOrder('${o.id}')">Hapus</button>`
                                }
                            </div>
                        </div>
                    </div>
                `;
                
                if (isCompleted) {
                    completedHTML += orderCardHTML;
                    completedOrdersCount++;
                } else {
                    activeHTML += orderCardHTML;
                    activeOrdersCount++;
                }
            });

            if (activeDiv) {
                if (activeOrdersCount > 0) {
                    activeDiv.innerHTML = activeHTML;
                } else {
                    activeDiv.innerHTML = '<div class="empty-state">🎉 Tidak ada pesanan yang sedang diproses. Santai sejenak!</div>';
                }
            }
            
            if (completedDiv) {
                if (completedOrdersCount > 0) {
                    completedDiv.innerHTML = completedHTML;
                } else {
                    completedDiv.innerHTML = '<div class="empty-state">Belum ada riwayat pesanan selesai.</div>';
                }
            }

        } else { 
            if(activeDiv) activeDiv.innerHTML = '<div class="empty-state">🍽️ Belum ada pesanan masuk.</div>';
            if(completedDiv) completedDiv.innerHTML = '<div class="empty-state">Belum ada riwayat pesanan selesai.</div>';
        }
    });
}

function updStatus(id, s) { 
    db.ref('orders/'+id).update({status: s}); 
}

function delOrder(id) { 
    if(confirm('Yakin ingin menghapus riwayat pesanan ini? Tindakan ini tidak dapat dibatalkan.')) {
        db.ref('orders/'+id).remove(); 
    }
}

// --- 7. ADMIN MENU MANAGEMENT ---
function addMenu(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const type = document.querySelector('input[name="imgType"]:checked').value;
    
    btn.disabled = true; btn.textContent = "Memproses Data...";
    if (statusDiv) statusDiv.textContent = "";

    if (type === 'file') {
        const file = document.getElementById('mImgFile').files[0];
        if(!file) { alert("Pilih foto dulu!"); btn.disabled=false; btn.textContent="Simpan Menu Baru"; return; }
        if(file.size > 700000) { alert("❌ Foto terlalu besar! Max 700KB."); btn.disabled=false; btn.textContent="Simpan Menu Baru"; return; }

        const reader = new FileReader();
        reader.onload = function(evt) { saveToDb(evt.target.result); };
        reader.readAsDataURL(file);
    } else {
        const emoji = document.getElementById('mEmojiTxt').value.trim();
        if(!emoji) { alert("Isi emoji!"); btn.disabled=false; btn.textContent="Simpan Menu Baru"; return; }
        saveToDb(emoji);
    }

    function saveToDb(img) {
        const data = {
            name: document.getElementById('mName').value,
            price: parseInt(document.getElementById('mPrice').value),
            category: document.getElementById('mCat').value,
            description: document.getElementById('mDesc').value,
            image: img,
            rating: 5.0, deliveryTime: '20m'
        };
        db.ref('menu_items').push(data).then(() => {
            if(statusDiv) {
                statusDiv.textContent = "✅ Menu Berhasil Ditambahkan!";
                statusDiv.style.color = "var(--color-secondary)";
            }
            const form = document.querySelector('#tabAdd form');
            if(form) form.reset();
            btn.disabled = false; btn.textContent = "Simpan Menu Baru";
            setTimeout(() => switchTab('manage'), 1000);
        }).catch(err => {
            if(statusDiv) {
                statusDiv.textContent = `❌ Gagal: ${err.message}`;
                statusDiv.style.color = "var(--color-danger)";
            }
            btn.disabled = false; btn.textContent = "Simpan Menu Baru";
        });
    }
}

function listenMenu() {
    if(!document.getElementById('manageList')) return;
    db.ref('menu_items').on('value', snap => {
        const data = snap.val();
        menuCache = data || {};
        const div = document.getElementById('manageList');
        div.innerHTML = '';
        
        if(data) {
            Object.keys(data).forEach(k => {
                const m = data[k];
                let thumb = (m.image && (m.image.startsWith('data:') || m.image.startsWith('http'))) 
                    ? `<img src="${m.image}" class="manage-thumb" alt="${m.name}">` 
                    : `<div class="manage-thumb">${m.image || '🍽️'}</div>`;
                
                div.innerHTML += `
                    <div class="manage-item">
                        ${thumb}
                        <div class="manage-info">
                            <div style="font-weight:bold; color:var(--color-text); font-size: 1.1rem;">${m.name}</div>
                            <div style="font-size:0.9rem; color:var(--color-text-light);">Rp ${m.price ? m.price.toLocaleString() : 0} | ${m.category}</div>
                        </div>
                        <div class="manage-actions">
                            <button class="btn btn-secondary btn-sm" onclick="openEditModal('${k}')">✏️ Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="delMenu('${k}', '${m.name}')">🗑️ Hapus</button>
                        </div>
                    </div>`;
            });
        } else { div.innerHTML = '<div class="empty-state">Menu kosong. Tambahkan menu baru!</div>'; }
    });
}
function delMenu(id, name) { 
    if(confirm(`Yakin ingin menghapus menu "${name}"?`)) {
        db.ref('menu_items/'+id).remove(); 
    }
}

function openEditModal(id) {
    const item = menuCache[id];
    if(!item) return;
    if(document.getElementById('editId')) document.getElementById('editId').value = id;
    if(document.getElementById('editName')) document.getElementById('editName').value = item.name;
    if(document.getElementById('editPrice')) document.getElementById('editPrice').value = item.price;
    if(document.getElementById('editCat')) document.getElementById('editCat').value = item.category;
    if(document.getElementById('editDesc')) document.getElementById('editDesc').value = item.description;
    
    const isFile = (item.image && (item.image.startsWith('data:') || item.image.startsWith('http')));
    
    if(document.getElementById('inputGroupFileEdit')) document.getElementById('inputGroupFileEdit').style.display = isFile ? 'block' : 'none';
    if(document.getElementById('inputGroupEmojiEdit')) document.getElementById('inputGroupEmojiEdit').style.display = !isFile ? 'block' : 'none';

    if (!isFile) {
        if(document.getElementById('editEmojiTxt')) document.getElementById('editEmojiTxt').value = item.image || '';
        if(document.querySelector('input[name="editImgType"][value="emoji"]')) document.querySelector('input[name="editImgType"][value="emoji"]').checked = true;
    } else {
        if(document.getElementById('editEmojiTxt')) document.getElementById('editEmojiTxt').value = '';
        if(document.querySelector('input[name="editImgType"][value="file"]')) document.querySelector('input[name="editImgType"][value="file"]').checked = true;
    }

    if(document.getElementById('editModal')) document.getElementById('editModal').classList.add('active');
}

function closeEditModal() { 
    if(document.getElementById('editModal')) document.getElementById('editModal').classList.remove('active'); 
}

function saveEditMenu(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const btn = document.getElementById('editSaveBtn');
    const type = document.querySelector('input[name="editImgType"]:checked').value;
    const file = document.getElementById('editImgFile').files[0];
    const emoji = document.getElementById('editEmojiTxt').value;

    btn.disabled = true; btn.textContent = "Updating...";

    let updates = {
        name: document.getElementById('editName').value,
        price: parseInt(document.getElementById('editPrice').value),
        category: document.getElementById('editCat').value,
        description: document.getElementById('editDesc').value
    };

    if (type === 'file' && file) {
        if(file.size > 700000) { alert("Foto terlalu besar! Max 700KB."); btn.disabled=false; btn.textContent="Update Menu"; return; }
        const reader = new FileReader();
        reader.onload = function(evt) { updates.image = evt.target.result; pushUpdate(id, updates, btn); };
        reader.readAsDataURL(file);
    } else if (type === 'emoji' && emoji) {
        updates.image = emoji; pushUpdate(id, updates, btn);
    } else {
        pushUpdate(id, updates, btn);
    }
}

function pushUpdate(id, data, btn) {
    db.ref('menu_items/' + id).update(data).then(() => {
        alert("✅ Menu Berhasil Diupdate!");
        closeEditModal();
        btn.disabled = false; btn.textContent = "Update Menu";
    }).catch(err => {
         alert(`❌ Gagal Update: ${err.message}`);
         btn.disabled = false; btn.textContent = "Update Menu";
    });
}
