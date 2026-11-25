// js/guru.js
let kredensialGuru = null;
let dataHasilTerakhir = [];

document.getElementById("form-login-guru").addEventListener("submit", async (e) => {
  e.preventDefault();
  const idGuru = document.getElementById("id-guru").value.trim();
  const kodeAkses = document.getElementById("kode-akses").value.trim();
  const btn = document.getElementById("btn-login-guru");

  btn.disabled = true;
  btn.textContent = "Memeriksa...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "guruLogin", idGuru, kodeAkses })
    });
    const hasil = await res.json();
    if (hasil.status !== "success") {
      throw new Error(hasil.message || "Login guru gagal.");
    }

    kredensialGuru = { idGuru, kodeAkses };
    document.getElementById("info-guru").textContent =
      `Guru: ${hasil.guru.namaGuru} (${hasil.guru.mapelAmpu || "Semua Mapel"})`;
    document.getElementById("panel-login-guru").style.display = "none";
    document.getElementById("area-kerja-guru").style.display = "flex";

    if (hasil.guru.mapelAmpu && hasil.guru.mapelAmpu.toUpperCase() !== "SEMUA") {
      document.getElementById("s-mapel").value = hasil.guru.mapelAmpu;
      document.getElementById("filter-mapel-hasil").value = hasil.guru.mapelAmpu;
    }

    muatHasilSiswa();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk Panel Guru";
  }
});

document.getElementById("form-upload-soal").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!kredensialGuru) return;

  const btn = document.getElementById("btn-simpan-soal");
  btn.disabled = true;
  btn.textContent = "Menyimpan soal...";

  const item = {
    idSoal: document.getElementById("s-id").value.trim(),
    mapel: document.getElementById("s-mapel").value.trim(),
    pertanyaan: document.getElementById("s-tanya").value.trim(),
    opsiA: document.getElementById("s-a").value.trim(),
    opsiB: document.getElementById("s-b").value.trim(),
    opsiC: document.getElementById("s-c").value.trim(),
    opsiD: document.getElementById("s-d").value.trim(),
    kunci: document.getElementById("s-kunci").value,
    bobot: Number(document.getElementById("s-bobot").value) || 1
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "uploadSoal",
        idGuru: kredensialGuru.idGuru,
        kodeAkses: kredensialGuru.kodeAkses,
        items: [item]
      })
    });
    const hasil = await res.json();
    if (hasil.status !== "success") throw new Error(hasil.message);

    document.getElementById("status-guru").textContent = hasil.message;
    document.getElementById("s-id").value = "";
    document.getElementById("s-tanya").value = "";
    document.getElementById("s-a").value = "";
    document.getElementById("s-b").value = "";
    document.getElementById("s-c").value = "";
    document.getElementById("s-d").value = "";
    document.getElementById("s-kunci").value = "";
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan Soal ke Google Sheets";
  }
});

async function muatHasilSiswa() {
  if (!kredensialGuru) return;
  const mapelFilter = document.getElementById("filter-mapel-hasil").value.trim();
  const tbody = document.getElementById("tbody-hasil");
  tbody.innerHTML = `<tr><td colspan="8" style="padding:12px;text-align:center;">Memuat hasil...</td></tr>`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "getHasil",
        idGuru: kredensialGuru.idGuru,
        kodeAkses: kredensialGuru.kodeAkses,
        mapelFilter
      })
    });
    const hasil = await res.json();
    if (hasil.status !== "success") throw new Error(hasil.message);

    dataHasilTerakhir = hasil.data || [];
    if (dataHasilTerakhir.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding:12px;text-align:center;">Belum ada data hasil ujian.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    dataHasilTerakhir.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.waktu}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.nis}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.nama}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.kelas}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.mapel}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:700;">${row.skor}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${row.pelanggaran ?? 0}x</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;max-width:260px;word-break:break-word;">${row.jawaban}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:12px;text-align:center;color:#b91c1c;">${err.message}</td></tr>`;
  }
}

document.getElementById("btn-muat-hasil").addEventListener("click", muatHasilSiswa);

document.getElementById("btn-export-csv").addEventListener("click", () => {
  if (!dataHasilTerakhir.length) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }
  const header = ["Waktu", "NIS", "Nama", "Kelas", "Mapel", "Skor", "Pelanggaran", "Jawaban_JSON"];
  const baris = dataHasilTerakhir.map((r) =>
    [r.waktu, r.nis, r.nama, r.kelas, r.mapel, r.skor, r.pelanggaran ?? 0, r.jawaban]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csvContent = "\uFEFF" + [header.join(","), ...baris].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rekap-hasil-ujian-cbt.csv";
  a.click();
  URL.revokeObjectURL(url);
});
