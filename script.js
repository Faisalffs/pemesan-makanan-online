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

// --- 2. GLOBAL VARIABLES ---
let menuData = [];
let cart = [];
let currentCategory = 'all';
let currentUser = null;

// --- 3. INIT ---
window.onload = function() {
    checkSession();
    fetchMenuFromFirebase();
};

// --- 4. MENU LOGIC (INI BAGIAN YANG DIPERBAIKI) ---
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
            grid.innerHTML = '<div class="empty-state">Belum ada menu tersedia.</div>';
        }
    });
}

function renderMenu() {
    const grid = document.getElementById('menuGrid');
    const term = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = menuData.filter(item => {
        const matchCat = currentCategory === 'all' || item.category === currentCategory;
        const matchSearch = item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Menu tidak ditemukan 😢</div>';
        return;
    }

    grid.innerHTML = filtered.map(item => {
        // --- LOGIKA BARU: DETEKSI GAMBAR VS EMOJI ---
        let tampilanGambar = '';
        
        // Cek apakah data image dimulai dengan "data:image" (Hasil Upload) atau "http" (Link internet)
        if (item.image.startsWith('data:image') || item.image.startsWith('http')) {
            // Tampilkan sebagai FOTO
            tampilanGambar = `<img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            // Tampilkan sebagai EMOJI (Teks Biasa)
            tampilanGambar = item.image;
        }

        return `
        <div class="menu-card">
            <div class="menu-img">${tampilanGambar}</div>
            <div class="menu-content">
                <h3 class="menu-title">${item.name}</h3>
                <p class="menu-desc">${item.description}</p>
                <div class="menu-meta">
                    <div class="rating">★ ${item.rating || 5.0}</div>
                    <div>🕒 ${item.deliveryTime || '20m'}</div>
                </div>
                <div class="menu-footer">
                    <div class="price">Rp ${item.price.toLocaleString('id-ID')}</div>
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
        updateCartUI(); renderCartList();
    }
}

function updateCartUI() {
    document.getElementById('cartBadge').textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
}

function openCart() { renderCartList(); document.getElementById('cartModal').classList.add('active'); }
function closeCart() { document.getElementById('cartModal').classList.remove('active'); }

function renderCartList() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    if(cart.length === 0) {
        container.innerHTML = '<div class="empty-state">Keranjang kosong 🛒</div>';
        summary.style.display = 'none'; return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info"><h4>${item.name}</h4><div>Rp ${item.price.toLocaleString('id-ID')}</div></div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
        </div>`).join('');
    
    const total = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
    document.getElementById('subtotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('totalPrice').textContent = `Rp ${(total + 10000).toLocaleString('id-ID')}`;
    summary.style.display = 'block';
}

function checkout() {
    if(!currentUser) {
        closeCart(); showNotification('🔒 Login dulu untuk pesan');
        setTimeout(() => document.getElementById('authModal').classList.add('active'), 500);
        return;
    }
    const container = document.getElementById('cartItems');
    container.innerHTML = `<div style="padding:15px; background:#252525; border-radius:12px; border:1px solid #333;">
        <h4 style="color:#FF9800; margin-bottom:10px;">📦 Detail Pengiriman</h4>
        <div class="form-group"><label class="form-label">Penerima</label><input type="text" class="search-input" value="${currentUser.name}" readonly></div>
        <div class="form-group"><label class="form-label">Alamat</label><textarea class="search-input" rows="2" readonly>${currentUser.address}</textarea></div>
    </div>`;
    document.getElementById('cartSummary').innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="confirmOrder()">🚀 Kirim Pesanan</button>`;
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
        document.getElementById('trackingModal').classList.add('active');
        showNotification('🎉 Pesanan Terkirim!');
    }).catch(err => showNotification('❌ Gagal kirim pesanan.'));
}
function closeTracking() { document.getElementById('trackingModal').classList.remove('active'); }

// --- 6. AUTH ---
function checkSession() {
    const saved = localStorage.getItem('food_delivery_user_session');
    if(saved) currentUser = JSON.parse(saved);
    updateAuthUI();
}

function updateAuthUI() {
    if(currentUser) {
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('userDisplay').textContent = `👤 ${currentUser.name.split(' ')[0]}`;
        document.getElementById('userBtn').className = 'btn btn-primary';
    } else {
        document.getElementById('userDisplay').textContent = `👤 Login`;
        document.getElementById('userBtn').className = 'btn btn-secondary';
    }
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
    
    // Cek Email
    database.ref('users').orderByChild('email').equalTo(input).once('value').then(snap => {
        if(snap.exists()) validateUser(snap, pass);
        else {
            // Cek Username
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
    if(foundUser.password === password) {
        currentUser = foundUser;
        localStorage.setItem('food_delivery_user_session', JSON.stringify(currentUser));
        updateAuthUI();
        showNotification(`✅ Berhasil Masuk!`);
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
            showNotification('✅ Akun Berhasil Dibuat!');
        });
    } else { showNotification('❌ Data belum lengkap.'); }
}

function handleLogout() {
    if(!confirm('Keluar akun?')) return;
    localStorage.removeItem('food_delivery_user_session');
    sessionStorage.removeItem('isAdminLoggedIn');
    currentUser = null;
    closeProfile();
    updateAuthUI();
    showNotification('👋 Logout Berhasil');
    setTimeout(() => window.location.reload(), 1000);
}

// --- UTILS ---
function toggleUserMenu() { currentUser ? openProfile() : document.getElementById('authModal').classList.add('active'); }
function showLogin() { document.getElementById('loginForm').style.display='block'; document.getElementById('registerForm').style.display='none'; document.getElementById('authTitle').textContent='Login'; }
function showRegister() { document.getElementById('loginForm').style.display='none'; document.getElementById('registerForm').style.display='block'; document.getElementById('authTitle').textContent='Daftar Akun'; }
function closeAuth() { document.getElementById('authModal').classList.remove('active'); }

function openProfile() {
    if (!currentUser) return;
    try {
        const history = JSON.parse(localStorage.getItem('food_delivery_orders') || '[]');
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileUsername').textContent = '@' + (currentUser.username || '-');
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profilePhone').textContent = currentUser.phone;
        document.getElementById('profileAddress').textContent = currentUser.address;
        document.getElementById('profileOrders').textContent = history.length;
        document.getElementById('profileModal').classList.add('active');
    } catch (e) { console.error(e); }
}
function closeProfile() { document.getElementById('profileModal').classList.remove('active'); }

function showNotification(msg) {
    const note = document.createElement('div');
    note.textContent = msg;
    note.style.cssText = "position:fixed; top:20px; right:20px; background:#333; color:white; padding:12px 24px; border-radius:8px; z-index:9999; animation: slideIn 0.3s;";
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}

window.onclick = function(e) {
    if(e.target.classList.contains('modal')) {
        if(e.target.id === 'authModal') return; 
        e.target.classList.remove('active');
    }
}
