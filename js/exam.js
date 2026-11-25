// js/exam.js
const DURASI_MENIT = 90;
const KUNCI_STORAGE =
  typeof KUNCI_PENYIMPANAN !== "undefined" && KUNCI_PENYIMPANAN
    ? KUNCI_PENYIMPANAN
    : "cbt_ma_sihu_sesi_v1";
const BATAS_PINDAH_TAB = 3;

const CONTOH_SOAL = [
  {
    id: "S1",
    pertanyaan: "Apa kepanjangan dari CBT dalam konteks ujian berbasis komputer?",
    opsi: {
      A: "Computer-Based Test",
      B: "Centralized Browser Tool",
      C: "Class Basic Training",
      D: "Computerized Book Tab",
      E: "Centralized Binary Terminal"
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
      D: "Surabaya",
      E: "Banjarmasin"
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
      D: "Agar soal terhapus otomatis",
      E: "Agar halaman login tertutup"
    },
    kunci: "B"
  }
];

function muatSesi() {
  let tersimpan = null;
  try {
    tersimpan = JSON.parse(localStorage.getItem(KUNCI_STORAGE) || "null");
  } catch (e) {
    tersimpan = null;
  }

  if (tersimpan && tersimpan.waktuSelesai) {
    return tersimpan;
  }

  const sesiBaru = {
    nis: "-",
    nama: "Peserta Uji Coba",
    kelas: "-",
    namaPeserta: "Peserta Uji Coba",
    mapel: "Umum",
    durasiMenit: DURASI_MENIT,
    waktuSelesai: Date.now() + DURASI_MENIT * 60 * 1000,
    soalList: CONTOH_SOAL,
    indeksAktif: 0,
    jawaban: {},
    pelanggaran: 0
  };

  localStorage.setItem(KUNCI_STORAGE, JSON.stringify(sesiBaru));
  return sesiBaru;
}

let sesi = muatSesi();
const daftarSoalAktif =
  Array.isArray(sesi.soalList) && sesi.soalList.length > 0 ? sesi.soalList : CONTOH_SOAL;
let jumlahPelanggaran = Number(sesi.pelanggaran || 0);
let sedangProsesKirim = false;

function simpanSesi() {
  sesi.pelanggaran = jumlahPelanggaran;
  sesi.soalList = daftarSoalAktif;
  localStorage.setItem(KUNCI_STORAGE, JSON.stringify(sesi));
}

async function kirimAutosaveKeServer() {
  if (typeof API_URL === "undefined" || !API_URL || API_URL.includes("TEMPEL_")) return;
  if (!sesi.nis || sesi.nis === "-") return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "autosave",
        nis: sesi.nis,
        nama: sesi.nama || sesi.namaPeserta,
        kelas: sesi.kelas || "-",
        mapel: sesi.mapel || "Umum",
        answers: sesi.jawaban || {},
        pelanggaran: jumlahPelanggaran
      })
    });
  } catch (e) {
    // Tetap aman di lokal jika jaringan sedang tersendat
  }
}

function tampilkanSoal() {
  if (sesi.indeksAktif < 0) sesi.indeksAktif = 0;
  if (sesi.indeksAktif >= daftarSoalAktif.length) {
    sesi.indeksAktif = daftarSoalAktif.length - 1;
  }

  const soal = daftarSoalAktif[sesi.indeksAktif] || daftarSoalAktif[0];
  document.getElementById("info-peserta").textContent =
    `Peserta: ${sesi.namaPeserta || sesi.nama || "-"}`;
  document.getElementById("nomor-soal-label").textContent =
    `Soal ${sesi.indeksAktif + 1} dari ${daftarSoalAktif.length}`;
  document.getElementById("teks-pertanyaan").textContent = soal.pertanyaan;

  const wadahOpsi = document.getElementById("daftar-opsi");
  wadahOpsi.innerHTML = "";

  const urutanHuruf = ["A", "B", "C", "D", "E"];
  const entriesOpsi = urutanHuruf
    .filter((h) => soal.opsi && soal.opsi[h] !== undefined && String(soal.opsi[h]).trim() !== "")
    .map((h) => [h, soal.opsi[h]]);

  entriesOpsi.forEach(([huruf, teksOpsi]) => {
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
      kirimAutosaveKeServer();
    });

    const span = document.createElement("span");
    span.textContent = `${huruf}. ${teksOpsi}`;

    label.appendChild(radio);
    label.appendChild(span);
    wadahOpsi.appendChild(label);
  });

  document.getElementById("btn-prev").disabled = sesi.indeksAktif === 0;
  document.getElementById("btn-next").disabled = sesi.indeksAktif === daftarSoalAktif.length - 1;
}

function tampilkanGridNomor() {
  const grid = document.getElementById("grid-nomor");
  grid.innerHTML = "";

  daftarSoalAktif.forEach((soal, idx) => {
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

async function selesaikanUjian(otomatis = false) {
  if (sedangProsesKirim) return;
  sedangProsesKirim = true;
  clearInterval(intervalTimer);
  simpanSesi();

  let nilaiServer = null;
  let benarLokal = 0;

  daftarSoalAktif.forEach((soal) => {
    if (soal.kunci && sesi.jawaban[soal.id] === soal.kunci) {
      benarLokal += 1;
    }
  });

  if (typeof API_URL !== "undefined" && API_URL && !API_URL.includes("TEMPEL_") && sesi.nis && sesi.nis !== "-") {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "submit",
          nis: sesi.nis,
          nama: sesi.nama || sesi.namaPeserta,
          kelas: sesi.kelas || "-",
          mapel: sesi.mapel || "Umum",
          answers: sesi.jawaban || {},
          pelanggaran: jumlahPelanggaran
        })
      });
      const hasil = await res.json();
      if (hasil && hasil.status === "success" && hasil.nilai !== undefined) {
        nilaiServer = hasil.nilai;
      }
    } catch (e) {
      // Fallback ke perhitungan lokal jika gagal kontak server
    }
  }

  const nilaiTampil =
    nilaiServer !== null ? nilaiServer : Math.round((benarLokal / daftarSoalAktif.length) * 100);
  const pembuka = otomatis ? "Waktu habis / ujian dikumpulkan otomatis!\n" : "Ujian selesai!\n";

  alert(
    `${pembuka}Peserta: ${sesi.namaPeserta || sesi.nama}\n` +
    `Pelanggaran Layar: ${jumlahPelanggaran}x\n` +
    `Nilai Akhir: ${nilaiTampil}`
  );

  localStorage.removeItem(KUNCI_STORAGE);
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

function pulihkanStatusPelanggaran() {
  if (jumlahPelanggaran > 0) {
    const sisaKesempatan = Math.max(0, BATAS_PINDAH_TAB - jumlahPelanggaran);
    tampilkanPeringatan(
      `Peringatan tersimpan (${jumlahPelanggaran}/${BATAS_PINDAH_TAB}): ` +
      `Sisa kesempatan ${sisaKesempatan}x sebelum ujian otomatis dikumpulkan.`
    );
  }
}

function catatPelanggaran(alasan) {
  if (sedangProsesKirim) return;

  jumlahPelanggaran += 1;
  simpanSesi();
  kirimAutosaveKeServer();

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
  if (sesi.indeksAktif < daftarSoalAktif.length - 1) {
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

["copy", "cut", "dragstart", "contextmenu"].forEach((namaEvent) => {
  document.addEventListener(namaEvent, (e) => {
    e.preventDefault();
  });
});

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

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.body.classList.add("tersembunyi");
  } else {
    document.body.classList.remove("tersembunyi");
    catatPelanggaran("keluar dari halaman ujian / pindah tab");
  }
});

window.addEventListener("blur", () => {
  document.body.classList.add("mode-tangkap-layar");
});

window.addEventListener("focus", () => {
  document.body.classList.remove("mode-tangkap-layar");
});

tampilkanSoal();
tampilkanGridNomor();
pulihkanStatusPelanggaran();
const intervalTimer = setInterval(perbaruiTimer, 1000);
perbaruiTimer();
