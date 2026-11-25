// js/exam.js
const DURASI_MENIT = 90;
"cbt_ma_sihu_sesi_v1";
const BATAS_PINDAH_TAB = 3;

const CONTOH_SOAL = [
  {
    id: "S1",
    pertanyaan: "Apa kepanjangan dari CBT dalam konteks ujian berbasis komputer?",
    opsi: {
      A: "Computer-Based Test",
      B: "Centralized Browser Tool",
      C: "Class Basic Training",
      D: "Computerized Book Tab"
    },
    kunci: "A"
  },
  {
    id: "S2",
    pertanyaan: "Di mana madrasah ini berada?",
    opsi: {
      A: "Marindi",
      B: "Bandung",
      C: "Yogyakarta",
      D: "Surabaya"
    },
    kunci: "A"
  },
  {
    id: "S3",
    pertanyaan: "Mengapa jawaban siswa perlu disimpan otomatis saat ujian berlangsung?",
    opsi: {
      A: "Agar layar berubah warna",
      B: "Agar jawaban tidak hilang jika koneksi terputus atau halaman ter-refresh",
      C: "Agar timer berhenti selamanya",
      D: "Agar soal terhapus otomatis"
    },
    kunci: "B"
  }
];

function muatSesi() {
  let tersimpan = null;
  try {
    tersimpan = JSON.parse(localStorage.getItem(KUNCI_PENYIMPANAN) || "null");
  } catch (e) {
    tersimpan = null;
  }

  if (tersimpan && tersimpan.waktuSelesai) {
    return tersimpan;
  }

  const sesiBaru = {
    nis: "-",
    namaPeserta: "Peserta Uji Coba",
    waktuSelesai: Date.now() + DURASI_MENIT * 90 * 1000,
    indeksAktif: 0,
    jawaban: {},
    pelanggaran: 0
  };

  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(sesiBaru));
  return sesiBaru;
}

let sesi = muatSesi();
let jumlahPelanggaran = Number(sesi.pelanggaran || 0);
let sedangProsesKirim = false;

function simpanSesi() {
  sesi.pelanggaran = jumlahPelanggaran;
  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(sesi));
}

function tampilkanSoal() {
  const soal = CONTOH_SOAL[sesi.indeksAktif] || CONTOH_SOAL[0];
  document.getElementById("info-peserta").textContent = `Peserta: ${sesi.namaPeserta}`;
  document.getElementById("nomor-soal-label").textContent =
    `Soal ${sesi.indeksAktif + 1} dari ${CONTOH_SOAL.length}`;
  document.getElementById("teks-pertanyaan").textContent = soal.pertanyaan;

  const wadahOpsi = document.getElementById("daftar-opsi");
  wadahOpsi.innerHTML = "";

  Object.entries(soal.opsi).forEach(([huruf, teksOpsi]) => {
    const label = document.createElement("label");
    label.className = "item-opsi";
    if (sesi.jawaban[soal.id] === huruf) {
      label.classList.add("terpilih");
    }

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `soal_${soal.id}`;
    radio.value = huruf;
    radio.checked = sesi.jawaban[soal.id] === huruf;

    radio.addEventListener("change", () => {
      sesi.jawaban[soal.id] = huruf;
      simpanSesi();
      tampilkanSoal();
      tampilkanGridNomor();
      document.getElementById("status-simpan").textContent =
        `Jawaban soal ${sesi.indeksAktif + 1} (${huruf}) tersimpan.`;
    });

    const span = document.createElement("span");
    span.textContent = `${huruf}. ${teksOpsi}`;

    label.appendChild(radio);
    label.appendChild(span);
    wadahOpsi.appendChild(label);
  });

  document.getElementById("btn-prev").disabled = sesi.indeksAktif === 0;
  document.getElementById("btn-next").disabled = sesi.indeksAktif === CONTOH_SOAL.length - 1;
}

function tampilkanGridNomor() {
  const grid = document.getElementById("grid-nomor");
  grid.innerHTML = "";

  CONTOH_SOAL.forEach((soal, idx) => {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = idx + 1;
    tombol.className = "kotak-nomor";

    if (idx === sesi.indeksAktif) {
      tombol.classList.add("aktif");
    }
    if (sesi.jawaban[soal.id]) {
      tombol.classList.add("terjawab");
    }

    tombol.addEventListener("click", () => {
      sesi.indeksAktif = idx;
      simpanSesi();
      tampilkanSoal();
      tampilkanGridNomor();
    });

    grid.appendChild(tombol);
  });
}

function perbaruiTimer() {
  const sisaMs = Math.max(0, sesi.waktuSelesai - Date.now());
  const totalDetik = Math.floor(sisaMs / 1000);
  const menit = String(Math.floor(totalDetik / 60)).padStart(2, "0");
  const detik = String(totalDetik % 60).padStart(2, "0");

  document.getElementById("timer-ujian").textContent = `${menit}:${detik}`;

  if (totalDetik <= 0) {
    clearInterval(intervalTimer);
    selesaikanUjian(true);
  }
}

function selesaikanUjian(otomatis = false) {
  sedangProsesKirim = true;
  clearInterval(intervalTimer);

  let benar = 0;
  CONTOH_SOAL.forEach((soal) => {
    if (sesi.jawaban[soal.id] === soal.kunci) {
      benar += 1;
    }
  });

  const nilai = Math.round((benar / CONTOH_SOAL.length) * 100);
  const pembuka = otomatis ? "Waktu habis / ujian dikumpulkan otomatis!\n" : "Ujian selesai!\n";

  alert(
    `${pembuka}Peserta: ${sesi.namaPeserta}\n` +
    `Jawaban Benar: ${benar} dari ${CONTOH_SOAL.length}\n` +
    `Pelanggaran Layar: ${jumlahPelanggaran}x\n` +
    `Nilai Akhir: ${nilai}`
  );

  localStorage.removeItem(KUNCI_PENYIMPANAN);
  window.location.href = "index.html";
}

function tampilkanPeringatan(pesan) {
  const banner = document.getElementById("banner-peringatan");
  if (banner) {
    banner.textContent = pesan;
    banner.classList.add("aktif");
  }
  const statusEl = document.getElementById("status-simpan");
  if (statusEl) {
    statusEl.textContent = pesan;
  }
}

function catatPelanggaran(alasan) {
  if (sedangProsesKirim) return;

  jumlahPelanggaran += 1;
  simpanSesi();

  const sisaKesempatan = BATAS_PINDAH_TAB - jumlahPelanggaran;

  if (jumlahPelanggaran >= BATAS_PINDAH_TAB) {
    alert(
      `Batas pelanggaran (${BATAS_PINDAH_TAB}x) tercapai karena ${alasan}.\n` +
      `Ujian akan otomatis dikumpulkan sekarang.`
    );
    selesaikanUjian(true);
    return;
  }

  tampilkanPeringatan(
    `Peringatan (${jumlahPelanggaran}/${BATAS_PINDAH_TAB}): Terdeteksi ${alasan}. ` +
    `Sisa kesempatan: ${sisaKesempatan}x sebelum ujian otomatis dikumpulkan.`
  );
}

document.getElementById("btn-prev").addEventListener("click", () => {
  if (sesi.indeksAktif > 0) {
    sesi.indeksAktif -= 1;
    simpanSesi();
    tampilkanSoal();
    tampilkanGridNomor();
  }
});

document.getElementById("btn-next").addEventListener("click", () => {
  if (sesi.indeksAktif < CONTOH_SOAL.length - 1) {
    sesi.indeksAktif += 1;
    simpanSesi();
    tampilkanSoal();
    tampilkanGridNomor();
  }
});

document.getElementById("btn-selesai").addEventListener("click", () => {
  if (confirm("Yakin ingin mengumpulkan ujian sekarang?")) {
    selesaikanUjian(false);
  }
});

// Blokir copy, cut, drag, dan klik kanan / tekan lama menu konteks
["copy", "cut", "dragstart", "contextmenu"].forEach((namaEvent) => {
  document.addEventListener(namaEvent, (e) => {
    e.preventDefault();
  });
});

// Deteksi tombol PrintScreen / kombinasi tangkap layar di keyboard
window.addEventListener("keydown", (e) => {
  const adalahPrintScreen = e.key === "PrintScreen" || e.code === "PrintScreen";
  const adalahSnipShortcut =
    (e.ctrlKey || e.metaKey) && e.shiftKey && ["s", "x"].includes(e.key.toLowerCase());

  if (adalahPrintScreen || adalahSnipShortcut) {
    e.preventDefault();
    document.body.classList.add("mode-tangkap-layar");
    setTimeout(() => {
      document.body.classList.remove("mode-tangkap-layar");
    }, 2500);
    catatPelanggaran("upaya tangkap layar (screenshot)");
  }
});

// Deteksi saat siswa berpindah tab, meminimalkan browser, atau pindah aplikasi di HP
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.body.classList.add("tersembunyi");
  } else {
    document.body.classList.remove("tersembunyi");
    catatPelanggaran("keluar dari halaman ujian / pindah tab");
  }
});

// Deteksi kehilangan fokus jendela (misal split screen / pop-up aplikasi lain)
window.addEventListener("blur", () => {
  document.body.classList.add("mode-tangkap-layar");
});

window.addEventListener("focus", () => {
  document.body.classList.remove("mode-tangkap-layar");
});

tampilkanSoal();
tampilkanGridNomor();
const intervalTimer = setInterval(perbaruiTimer, 1000);
perbaruiTimer();
