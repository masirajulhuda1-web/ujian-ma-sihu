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
