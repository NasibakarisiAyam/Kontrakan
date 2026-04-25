import { useState, useEffect } from "react";
import axios from "axios";
import { Printer, Eye, Download, Search, ChevronDown, ChevronUp } from "lucide-react";

export default function History() {
  const [pembayaran, setPembayaran] = useState([]);
  const [kontrakanHistory, setKontrakanHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("semua");
  const [expandedRow, setExpandedRow] = useState(null);
  const [kontrakanMap, setKontrakanMap] = useState({});
  const [penyewaMap, setPenyewaMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPembayaran, resKontrakan, resPenyewa] = await Promise.all([
          axios.get("http://localhost:5000/api/pembayaran"),
          axios.get("http://localhost:5000/api/kontrakan"),
          axios.get("http://localhost:5000/api/penyewa"),
        ]);

        // Map data untuk referensi cepat
        const kontrakanData = {};
        (resKontrakan.data?.data || []).forEach((k) => {
          kontrakanData[k._id] = k;
        });
        setKontrakanMap(kontrakanData);

        const penyewaData = {};
        (resPenyewa.data?.data || []).forEach((p) => {
          penyewaData[p._id] = p;
        });
        setPenyewaMap(penyewaData);

        // Collect kontrakan history
        const allKontrakanHistory = [];
        (resKontrakan.data?.data || []).forEach((k) => {
          if (k.history && k.history.length > 0) {
            k.history.forEach((h) => {
              allKontrakanHistory.push({
                ...h,
                kontrakan: k,
                penyewa: penyewaData[k.penyewa],
                type: 'history',
                id: `${k._id}_${h.date}_${h.type}`,
              });
            });
          }
        });
        const sortedKontrakanHistory = allKontrakanHistory.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setKontrakanHistory(sortedKontrakanHistory);

        // Sort by tanggalUpload descending (newest first)
        const sortedPembayaran = (resPembayaran.data || []).map(p => ({
          ...p,
          type: 'payment',
          id: p._id,
          date: p.tanggalUpload,
        })).sort(
          (a, b) => new Date(b.tanggalUpload) - new Date(a.tanggalUpload)
        );
        setPembayaran(sortedPembayaran);

        // Combine all history
        const combinedHistory = [
          ...sortedPembayaran,
          ...sortedKontrakanHistory
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllHistory(combinedHistory);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrint = (pembayaran) => {
    const kontrakan = kontrakanMap[pembayaran.kontrakan];
    const penyewa = penyewaMap[pembayaran.penyewa];

    if (!kontrakan || !penyewa) return;

    const printWindow = window.open("", "", "height=600,width=800");
    const tanggalUpload = new Date(pembayaran.tanggalUpload).toLocaleDateString("id-ID");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Pembayaran</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: white;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 12px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            background: #f0f0f0;
            padding: 8px 10px;
            margin-bottom: 10px;
            border-left: 4px solid #d946ef;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .label {
            font-weight: bold;
            width: 150px;
          }
          .value {
            flex: 1;
            text-align: left;
            padding-left: 20px;
          }
          .footer {
            text-align: center;
            border-top: 2px solid #333;
            padding-top: 15px;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
          }
          .status-lunas {
            background: #dcfce7;
            color: #166534;
          }
          .separator {
            border-bottom: 1px dashed #999;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>📦 SmartKontrakan</h1>
            <p>Bukti Pembayaran Kontrakan</p>
            <p>Nomor Invoice: ${pembayaran._id}</p>
          </div>

          <div class="section">
            <div class="section-title">Informasi Penyewa</div>
            <div class="row">
              <span class="label">Nama:</span>
              <span class="value">${penyewa.nama}</span>
            </div>
            <div class="row">
              <span class="label">No. Telepon:</span>
              <span class="value">${penyewa.noTelepon || "-"}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${penyewa.email || "-"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informasi Kontrakan</div>
            <div class="row">
              <span class="label">Nama Kontrakan:</span>
              <span class="value">${kontrakan.namaKontrakan}</span>
            </div>
            <div class="row">
              <span class="label">Alamat:</span>
              <span class="value">${kontrakan.alamat}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detail Pembayaran</div>
            <div class="row">
              <span class="label">Jumlah Bayar:</span>
              <span class="value">Rp ${pembayaran.jumlah?.toLocaleString("id-ID")}</span>
            </div>
            <div class="row">
              <span class="label">Metode:</span>
              <span class="value">${pembayaran.metodePembayaran}</span>
            </div>
            <div class="row">
              <span class="label">Bulan Pembayaran:</span>
              <span class="value">Bulan ke-${pembayaran.bulanPembayaran}</span>
            </div>
            <div class="row">
              <span class="label">Tanggal Pembayaran:</span>
              <span class="value">${tanggalUpload}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value"><span class="status-badge status-lunas">✓ ${pembayaran.status}</span></span>
            </div>
            ${pembayaran.keterangan ? `
            <div class="row">
              <span class="label">Keterangan:</span>
              <span class="value">${pembayaran.keterangan}</span>
            </div>
            ` : ""}
          </div>

          <div class="separator"></div>

          <div class="footer">
            <p>Terima kasih telah melakukan pembayaran tepat waktu.</p>
            <p>Dokumen ini merupakan bukti pembayaran yang sah.</p>
            <p style="margin-top: 20px; color: #999;">Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const filteredHistory = allHistory.filter((item) => {
    const kontrakan = kontrakanMap[item.kontrakan?._id || item.kontrakan];
    const penyewa = penyewaMap[item.penyewa?._id || item.penyewa];

    if (!kontrakan || !penyewa) return false;

    const matchesSearch =
      kontrakan.namaKontrakan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penyewa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === 'payment' ? item._id.includes(searchTerm) : item.id.includes(searchTerm));

    const matchesFilter =
      filterMethod === "semua" ||
      (item.type === 'payment' ? item.metodePembayaran === filterMethod : true);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <p className="mt-4 text-gray-600">Memuat history pembayaran...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          📋 History
        </h1>
        <p className="text-gray-600">Lihat semua riwayat pembayaran dan perpanjangan kontrakan</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari kontrakan, penyewa, atau invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="semua">Semua Metode</option>
          <option value="Cash">Cash</option>
          <option value="Transfer">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">Total Pembayaran</p>
          <p className="text-3xl font-bold">{filteredHistory.filter(item => item.type === 'payment').length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">Total Terkumpul</p>
          <p className="text-3xl font-bold">
            Rp {filteredHistory.filter(item => item.type === 'payment').reduce((sum, p) => sum + (p.jumlah || 0), 0).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">Perpanjangan</p>
          <p className="text-3xl font-bold">{filteredHistory.filter(item => item.type === 'history').length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">Total Aktivitas</p>
          <p className="text-3xl font-bold">{filteredHistory.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Kontrakan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Penyewa</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Jumlah</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Metode</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th>
              <th className="px-6 py-4 text-center text-sm font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <p className="text-lg font-semibold">Tidak ada history pembayaran</p>
                  <p className="text-sm">Data pembayaran akan muncul di sini</p>
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const kontrakan = kontrakanMap[item.kontrakan?._id || item.kontrakan];
                const penyewa = penyewaMap[item.penyewa?._id || item.penyewa];
                const isExpanded = expandedRow === item.id;
                const tanggal = new Date(item.date).toLocaleDateString("id-ID");

                if (item.type === 'payment') {
                  return (
                    <tbody key={item.id}>
                      <tr
                        className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : item.id)
                        }
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {kontrakan?.namaKontrakan}
                          </p>
                          <p className="text-sm text-gray-500">
                            {kontrakan?.alamat}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {penyewa?.nama}
                          </p>
                          <p className="text-sm text-gray-500">
                            {penyewa?.noTelepon}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-lg text-pink-600">
                            Rp {item.jumlah?.toLocaleString("id-ID")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {item.metodePembayaran}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {tanggal}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint(item);
                              }}
                              className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-md transition"
                              title="Cetak Struk"
                            >
                              <Printer size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : item.id);
                              }}
                              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan="6" className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Left Column */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">
                                  Detail Invoice
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Invoice ID:
                                    </span>
                                    <span className="font-mono text-sm font-semibold">
                                      {item._id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Bulan Pembayaran:
                                    </span>
                                    <span className="font-semibold">
                                      Bulan ke-{item.bulanPembayaran}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                      ✓ {item.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">
                                  Timeline
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Tanggal Upload:
                                    </span>
                                    <span className="font-semibold">
                                      {tanggal}
                                    </span>
                                  </div>
                                  {item.tanggalKonfirmasi && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Dikonfirmasi:
                                      </span>
                                      <span className="font-semibold">
                                        {new Date(
                                          item.tanggalKonfirmasi
                                        ).toLocaleDateString("id-ID")}
                                      </span>
                                    </div>
                                  )}
                                  {item.keterangan && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Keterangan:
                                      </span>
                                      <span className="font-semibold">
                                        {item.keterangan}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                } else if (item.type === 'history') {
                  return (
                    <tbody key={item.id}>
                      <tr
                        className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer bg-blue-50"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : item.id)
                        }
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {kontrakan?.namaKontrakan}
                          </p>
                          <p className="text-sm text-gray-500">
                            {kontrakan?.alamat}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {penyewa?.nama}
                          </p>
                          <p className="text-sm text-gray-500">
                            {penyewa?.noTelepon}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-lg text-blue-600">
                            🔄 Perpanjangan
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {item.details?.extendedMonths} Bulan
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {tanggal}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : item.id);
                              }}
                              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-blue-50 border-b border-gray-200">
                          <td colSpan="6" className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Left Column */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">
                                  Detail Perpanjangan
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Tanggal Lama:
                                    </span>
                                    <span className="font-semibold">
                                      {item.details?.oldDueDate ? new Date(item.details.oldDueDate).toLocaleDateString("id-ID") : "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Tanggal Baru:
                                    </span>
                                    <span className="font-semibold">
                                      {item.details?.newDueDate ? new Date(item.details.newDueDate).toLocaleDateString("id-ID") : "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Perpanjangan:</span>
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                      +{item.details?.extendedMonths} Bulan
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">
                                  Timeline
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Tanggal Perpanjangan:
                                    </span>
                                    <span className="font-semibold">
                                      {tanggal}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                }
                return null;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">💡 Tip:</span> Klik pada baris untuk melihat detail lengkap
          pembayaran, atau gunakan tombol printer untuk mencetak bukti pembayaran dalam format struk.
        </p>
      </div>
    </div>
  );
}
