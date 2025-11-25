# 🍔 Food Delivery Web App

Project ini adalah aplikasi pemesanan makanan berbasis web sederhana yang menggunakan arsitektur **Serverless** dengan **Firebase Realtime Database**. Aplikasi ini dikembangkan untuk memenuhi tugas **Final Project Mata Kuliah Rekayasa Perangkat Lunak (RPL)**.

---

## 👥 Identitas Kelompok
**Nama Kelompok:** [Tulis Nama Kelompok, misal: Kelompok 5]  
**Kelas:** [Tulis Kelas, misal: TI-3A]  
**Dosen Pengampu:** [Tulis Nama Dosen]

**Anggota Tim & Jobdesk:**
1. **[Nama Anggota 1]** ([NIM]) - *Contoh: Frontend Developer (UI/UX & CSS Styling)*
2. **[Nama Anggota 2]** ([NIM]) - *Contoh: Backend Logic (Firebase Integration & JS)*
3. **[Nama Anggota 3]** ([NIM]) - *Contoh: Project Manager & Dokumentasi (SRS/UAT)*

---

## 🔗 Link Akses
* **Aplikasi (Deployment):** [MASUKKAN LINK GITHUB PAGES ANDA DI SINI]
* **Repository:** [MASUKKAN LINK REPO GITHUB ANDA DI SINI]

---

## 🛠️ Teknologi yang Digunakan
Aplikasi ini dibangun menggunakan teknologi modern tanpa backend tradisional (Serverless):
* **Frontend:** HTML5, CSS3 (Custom Modern UI), JavaScript (Vanilla ES6).
* **Backend / Database:** Google Firebase Realtime Database.
* **Storage:** Base64 Image Encoding (Menyimpan gambar langsung sebagai text di database untuk efisiensi biaya).
* **Hosting:** GitHub Pages.

---

## ✨ Fitur Utama
Aplikasi terdiri dari dua aktor utama: **User (Pembeli)** dan **Admin (Penjual)**.

### 👤 Fitur User (Pembeli)
1.  **Registrasi & Login:** User dapat mendaftar akun dan data tersimpan di Cloud.
2.  **Katalog Menu:** Melihat daftar makanan dengan filter kategori (Nasi, Mie, Minuman, dll).
3.  **Pencarian:** Mencari menu berdasarkan nama.
4.  **Keranjang Belanja:** Menambah item dan mengatur jumlah pesanan.
5.  **Checkout:** Mengirim pesanan ke sistem Admin secara Realtime.
6.  **Profil & Riwayat:** Melihat data diri dan status jumlah pesanan.

### 👨‍🍳 Fitur Admin (Penjual)
1.  **Login Rahasia:** Akses khusus via halaman utama menggunakan *credential* tertentu.
2.  **Dashboard Realtime:** Menerima pesanan masuk tanpa refresh halaman.
3.  **Manajemen Pesanan:** Menerima, memproses, dan menghapus pesanan selesai.
4.  **CRUD Menu:** Menambah menu baru (dengan upload foto) dan menghapus menu lama.

---

## 🚀 Cara Menjalankan (Instalasi Lokal)
Jika ingin menjalankan project ini di komputer lokal (tanpa internet hosting):

1.  **Clone Repository**
    ```bash
    git clone [LINK REPO GITHUB ANDA]
    ```
2.  **Buka Folder**
    Masuk ke folder project.
3.  **Jalankan**
    Buka file `index.html` menggunakan browser (Chrome/Edge).
    *Saran: Gunakan Extension "Live Server" di VS Code untuk hasil terbaik.*

---

## 🔑 Akun Demo (Untuk Pengujian)
Gunakan akun berikut untuk menguji fitur Admin saat presentasi atau UAT:

| Role | Username / Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `12345` | Masuk lewat tombol Login di halaman utama |
| **User** | *(Silakan Daftar Sendiri)* | *(Bebas)* | Gunakan fitur "Daftar Akun" |

---

## 📝 Arsitektur Sistem
Aplikasi ini menggunakan pola **Client-Server** dengan pendekatan **BaaS (Backend as a Service)**.
* **Client Side:** Menangani logika tampilan dan interaksi user (`script.js`).
* **Database Side:** Firebase menangani penyimpanan data User, Menu, dan Pesanan (`JSON Tree`).

---

**Catatan:**
*Aplikasi ini adalah MVP (Minimum Viable Product). Fitur pembayaran hanya simulasi (COD).*
