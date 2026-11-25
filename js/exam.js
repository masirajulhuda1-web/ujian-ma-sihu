// js/exam.js
const DURASI_MENIT = 30;
const KUNCI_PENYIMPANAN = "cbt_ma_sihu_sesi_v1";

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
    waktuSelesai: Date.now() + DURASI_MENIT * 60 * 1000,
    indeksAktif: 0,
    jawaban: {}
  };

  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(sesiBaru));
  return sesiBaru;
}

let sesi = muatSesi();

function simpanSesi() {
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
  let benar = 0;
  CONTOH_SOAL.forEach((soal) => {
    if (sesi.jawaban[soal.id] === soal.kunci) {
      benar += 1;
    }
  });

  const nilai = Math.round((benar / CONTOH_SOAL.length) * 100);
  const pembuka = otomatis ? "Waktu habis!\n" : "Ujian selesai!\n";

  alert(
    `${pembuka}Peserta: ${sesi.namaPeserta}\n` +
    `Jawaban Benar: ${benar} dari ${CONTOH_SOAL.length}\n` +
    `Nilai Akhir: ${nilai}`
  );

  localStorage.removeItem(KUNCI_PENYIMPANAN);
  window.location.href = "index.html";
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

["copy", "cut", "contextmenu"].forEach((namaEvent) => {
  document.addEventListener(namaEvent, (e) => {
    e.preventDefault();
  });
});

let jumlahPelanggaran = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.body.classList.add("tersembunyi");
    jumlahPelanggaran += 1;
  } else {
    document.body.classList.remove("tersembunyi");
    if (jumlahPelanggaran > 0) {
      document.getElementById("status-simpan").textContent =
        `Peringatan: terdeteksi keluar layar ujian (${jumlahPelanggaran}x).`;
    }
  }
});

tampilkanSoal();
tampilkanGridNomor();
const intervalTimer = setInterval(perbaruiTimer, 1000);
perbaruiTimer();