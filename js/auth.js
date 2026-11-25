// js/auth.js
const TOKEN_UJIAN_AKTIF = "SIHU2026";
const KUNCI_PENYIMPANAN = "cbt_ma_sihu_sesi_v1";

document.getElementById("form-login").addEventListener("submit", (e) => {
  e.preventDefault();

  const nis = document.getElementById("nis").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const token = document.getElementById("token").value.trim().toUpperCase();

  if (!nis || !nama) {
    alert("Mohon lengkapi NIS dan Nama Lengkap terlebih dahulu.");
    return;
  }

  if (token !== TOKEN_UJIAN_AKTIF) {
    alert("Token ujian salah! Gunakan token uji coba: SIHU2026");
    return;
  }
async function muatDaftarMapelLogin() {
  const selectMapel = document.getElementById("mapel");
  if (!selectMapel || typeof API_URL === "undefined" || !API_URL || API_URL.includes("TEMPEL_")) {
    return;
  }

  const opsiAwal = Array.from(selectMapel.options)
    .filter((opt) => opt.value !== "")
    .map((opt) => opt.value);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "getMapel" })
    });
    const hasil = await res.json();
    if (hasil.status !== "success" || !Array.isArray(hasil.data)) return;

    const gabungan = [];
    const cek = new Set();

    [...hasil.data, ...opsiAwal].forEach((m) => {
      const bersih = String(m || "").trim();
      if (!bersih) return;
      const key = bersih.toLowerCase();
      if (!cek.has(key)) {
        cek.add(key);
        gabungan.push(bersih);
      }
    });

    if (gabungan.length > 0) {
      selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
      gabungan.forEach((namaMapel) => {
        const opt = document.createElement("option");
        opt.value = namaMapel;
        opt.textContent = namaMapel;
        selectMapel.appendChild(opt);
      });
    }
  } catch (e) {
    // Biarkan opsi awal di HTML tetap tampil jika jaringan gagal
  }
muatDaftarMapelLogin();
  // Simpan identitas peserta ke localStorage agar terbaca di exam.html
  const sesiBaru = {
    nis: nis,
    namaPeserta: `${nama} (${nis})`,
    waktuSelesai: Date.now() + 90 * 60 * 1000,
    indeksAktif: 0,
    jawaban: {}
  };

  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(sesiBaru));
  window.location.href = "exam.html";
});
