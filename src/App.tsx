import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Waves, 
  Menu, 
  X, 
  ArrowRight, 
  ShieldAlert, 
  AlertTriangle, 
  Droplet, 
  CloudRain, 
  TrendingUp, 
  MapPin, 
  PhoneCall, 
  Search, 
  ChevronDown, 
  Info, 
  Activity, 
  Bell, 
  CheckCircle2, 
  Flame, 
  Home, 
  RefreshCw,
  Zap,
  BookOpen,
  Send,
  HelpCircle
} from 'lucide-react';

// Define Interface and Types
interface FAQItem {
  question: string;
  answer: string;
}

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  station: string;
  timestamp: string;
}

interface StationData {
  id: 'mrican' | 'papringan' | 'kotagede';
  name: string;
  location: string;
  baseLevel: number; // in cm
  dangerLevel: number; // in cm
  warningLevel: number; // in cm
  siagaLevel: number; // in cm
  description: string;
}

const STATIONS: StationData[] = [
  {
    id: 'mrican',
    name: 'Mrican (Hulu)',
    location: 'Sleman / Depok (Bagian Utara)',
    baseLevel: 85,
    warningLevel: 120,
    siagaLevel: 180,
    dangerLevel: 220,
    description: 'Pintu air pemantau utama dari aliran hulu lereng Gunung Merapi. Deteksi pertama potensi kenaikan debit air.'
  },
  {
    id: 'papringan',
    name: 'Papringan (Tengah)',
    location: 'Caturtunggal / Depok (Bagian Tengah)',
    baseLevel: 72,
    warningLevel: 110,
    siagaLevel: 160,
    dangerLevel: 200,
    description: 'Titik pantau tengah yang melintasi kawasan padat hunian mahasiswa dan pemukiman semi-perkotaan.'
  },
  {
    id: 'kotagede',
    name: 'Kotagede (Hilir)',
    location: 'Kotagede / Giwangan (Bagian Selatan)',
    baseLevel: 60,
    warningLevel: 100,
    siagaLevel: 150,
    dangerLevel: 180,
    description: 'Pintu air hilir yang rawan luapan karena akumulasi debit air dari hulu serta penyempitan bantaran sungai.'
  }
];

const ASSEMBLY_POINTS = [
  {
    id: 'kumpul-1',
    name: 'Titik Kumpul 1',
    lat: -7.796483775216844,
    lng: 110.39580739522738,
    description: 'Koordinat titik kumpul pertama di jalur evakuasi.'
  },
  {
    id: 'kumpul-2',
    name: 'Titik Kumpul 2',
    lat: -7.797127133693203,
    lng: 110.39673545554132,
    description: 'Koordinat titik kumpul kedua di jalur evakuasi.'
  },
  {
    id: 'kumpul-3',
    name: 'Titik Kumpul 3',
    lat: -7.798121299586215,
    lng: 110.39574211725349,
    description: 'Koordinat titik kumpul ketiga di jalur evakuasi.'
  },
  {
    id: 'kumpul-4',
    name: 'Titik Kumpul 4',
    lat: -7.796184750802195,
    lng: 110.39643318461637,
    description: 'Koordinat titik kumpul keempat di jalur evakuasi.'
  }
];

export default function App() {
  const MONITORING_URL = 'https://banjirrt52.vercel.app/';

  // Mobile Nav drawer state
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Active Navigation Tab (for smooth scrolls or view changes)
  const [activeTab, setActiveTab] = useState('beranda');

  // Interactive Dashboard state
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [activeStation, setActiveStation] = useState<'mrican' | 'papringan' | 'kotagede'>('mrican');
  const [isHeavyRainSimulated, setIsHeavyRainSimulated] = useState(false);
  const [simulatedRainIntensity, setSimulatedRainIntensity] = useState(60); // mm/hour
  
  // Subscription form state
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    const saved = localStorage.getItem('gajah_wong_subscribers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Budi Santoso', phone: '0812345678xx', station: 'Mrican (Hulu)', timestamp: '02-07-2026' },
      { id: '2', name: 'Siti Rahma', phone: '0857291133xx', station: 'Kotagede (Hilir)', timestamp: '03-07-2026' }
    ];
  });
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [stationInput, setStationInput] = useState('mrican');
  const [showSubSuccess, setShowSubSuccess] = useState(false);

  // Evacuation calculator state
  const assemblyMapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!assemblyMapRef.current) return;

    const map = L.map(assemblyMapRef.current, {
      center: [ASSEMBLY_POINTS[0].lat, ASSEMBLY_POINTS[0].lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const markers = ASSEMBLY_POINTS.map(point => {
      return L.circleMarker([point.lat, point.lng], {
        radius: 8,
        fillColor: '#006d37',
        color: '#fff',
        weight: 2,
        fillOpacity: 1
      })
        .addTo(map)
        .bindPopup(`<strong>${point.name}</strong><br/>${point.description}`);
    });

    const group = L.featureGroup(markers as any);
    map.fitBounds(group.getBounds().pad(0.2));

    return () => {
      map.remove();
    };
  }, []);

  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  // Auto-scrolling state indicator based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      if (scrollPos < 500) {
        setActiveTab('beranda');
      } else if (scrollPos < 1200) {
        setActiveTab('sungai');
      } else if (scrollPos < 1900) {
        setActiveTab('risiko');
      } else {
        setActiveTab('edukasi');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save subscribers to local storage
  useEffect(() => {
    localStorage.setItem('gajah_wong_subscribers', JSON.stringify(subscribers));
  }, [subscribers]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim()) return;

    const matchedStation = STATIONS.find(s => s.id === stationInput);
    const newSub: Subscriber = {
      id: Date.now().toString(),
      name: nameInput,
      phone: phoneInput.length > 8 ? phoneInput.replace(/(?<=\d{4})\d+(?=\d{2})/, '*****') : phoneInput,
      station: matchedStation ? matchedStation.name : 'Mrican (Hulu)',
      timestamp: new Date().toLocaleDateString('id-ID')
    };

    setSubscribers([newSub, ...subscribers]);
    setNameInput('');
    setPhoneInput('');
    setShowSubSuccess(true);
    setTimeout(() => setShowSubSuccess(false), 4000);
  };

  const deleteSubscriber = (id: string) => {
    setSubscribers(subscribers.filter(sub => sub.id !== id));
  };

  // Helper function to get current water level based on simulation
  const getCurrentTMA = (stationId: 'mrican' | 'papringan' | 'kotagede') => {
    const s = STATIONS.find(x => x.id === stationId);
    if (!s) return 0;
    
    if (isHeavyRainSimulated) {
      // simulate elevated rain-fed level
      const multiplier = simulatedRainIntensity / 50; // default 60 -> 1.2
      if (stationId === 'mrican') return Math.round(s.baseLevel + 145 * multiplier);
      if (stationId === 'papringan') return Math.round(s.baseLevel + 120 * multiplier);
      return Math.round(s.baseLevel + 115 * multiplier);
    } else {
      // normal slightly fluctuating level
      return s.baseLevel;
    }
  };

  // Get status details based on water level
  const getStatusInfo = (stationId: 'mrican' | 'papringan' | 'kotagede', level: number) => {
    const s = STATIONS.find(x => x.id === stationId);
    if (!s) return { text: 'Unknown', color: 'bg-gray-500', textClass: 'text-gray-500', alertClass: 'bg-gray-100 text-gray-800' };

    if (level >= s.dangerLevel) {
      return { 
        text: 'DARURAT (SIAGA 1)', 
        color: 'bg-red-600 animate-pulse', 
        textClass: 'text-red-600 font-bold', 
        alertClass: 'bg-red-50 text-red-700 border-red-300',
        badge: 'bg-red-100 text-red-800',
        desc: 'Segera lakukan evakuasi mandiri sekarang juga! Air mulai meluap ke bantaran pemukiman.'
      };
    } else if (level >= s.siagaLevel) {
      return { 
        text: 'SIAGA (SIAGA 2)', 
        color: 'bg-amber-500', 
        textClass: 'text-amber-500 font-bold', 
        alertClass: 'bg-amber-50 text-amber-800 border-amber-300',
        badge: 'bg-amber-100 text-amber-800',
        desc: 'Waspada tinggi. Siapkan Tas Siaga Bencana dan amankan barang berharga ke tempat tinggi.'
      };
    } else if (level >= s.warningLevel) {
      return { 
        text: 'WASPADAI (SIAGA 3)', 
        color: 'bg-yellow-400', 
        textClass: 'text-yellow-600 font-bold', 
        alertClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        desc: 'Kenaikan debit air mulai signifikan. Pantau terus perkembangan informasi pintu air.'
      };
    } else {
      return { 
        text: 'AMAN (NORMAL)', 
        color: 'bg-emerald-500', 
        textClass: 'text-emerald-600 font-bold', 
        alertClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        desc: 'Tinggi muka air berada pada ambang batas aman normal harian.'
      };
    }
  };

  const activeStationData = STATIONS.find(s => s.id === activeStation)!;
  const currentTMA = getCurrentTMA(activeStation);
  const statusInfo = getStatusInfo(activeStation, currentTMA);

  // Evacuation route calculator logic
  // Filter FAQ list
  const FAQS: FAQItem[] = [
    {
      question: "Apa yang harus dilakukan jika sirine peringatan dini berbunyi?",
      answer: "Segera tinggalkan rumah dan menuju ke titik evakuasi terdekat yang berada di dataran lebih tinggi. Jangan membuang waktu untuk menyelamatkan barang berharga yang berat. Utamakan keselamatan jiwa Anda dan keluarga."
    },
    {
      question: "Bagaimana cara menyiapkan Tas Siaga Bencana (TSB) secara mandiri?",
      answer: "Siapkan tas ransel tahan air dan isi dengan kebutuhan pokok untuk minimal 3 hari: dokumen penting (bungkus plastik kedap air), pakaian ganti, senter & baterai cadangan, P3K & obat pribadi, air minum, makanan instan, powerbank, masker, dan uang tunai secukupnya."
    },
    {
      question: "Apakah data dashboard monitoring ketinggian air diperbarui secara real-time?",
      answer: "Ya, sistem monitoring kami menggunakan sensor ultrasonik IoT canggih yang terpasang di Balai RT 52, Gardu Pandang RW 08, dan Pandeyan. Data diperbarui secara otomatis setiap 5 menit dan langsung diunggah ke cloud sistem."
    },
    {
      question: "Bagaimana cara mendaftar notifikasi peringatan banjir via WhatsApp?",
      answer: "Anda dapat mendaftar dengan mudah melalui formulir 'Daftar Peringatan Banjir' yang tersedia di aplikasi ini. Masukkan nama, nomor WhatsApp aktif, dan pilih stasiun pengamatan terdekat dari tempat tinggal Anda."
    },
    {
      question: "Siapa saja yang mendukung gerakan mitigasi bencana Sungai Gajah Wong?",
      answer: "Program ini didukung oleh komunitas relawan mitigasi bencana Sungai Gajah Wong, Dinas Lingkungan Hidup DIY, KKT-PPM Universitas Gadjah Mada (UGM), serta lembaga lokal yang aktif mengedukasi warga bantaran sungai secara berkelanjutan."
    }
  ];

  const filteredFaqs = FAQS.filter(f => 
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveTab(id);
      setIsNavOpen(false);
    }
  };

  return (
    <div className="font-sans antialiased bg-[radial-gradient(circle_at_top_left,_rgba(0,59,90,0.16),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(107,254,156,0.12),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(66,153,225,0.1),_transparent_24%),linear-gradient(180deg,#eef7ff_0%,#f7f9ff_30%,#eef7f0_100%)] text-[#091d2e] selection:bg-[#6bfe9c] selection:text-[#00743a] min-h-screen">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f9ff]/90 backdrop-blur-md border-b border-[#c1c7cf]/30 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <button 
              id="btn-toggle-menu"
              className="md:hidden p-2.5 rounded-full hover:bg-[#edf4ff] transition-all active:scale-95" 
              onClick={() => setIsNavOpen(true)}
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5 text-[#003b5a]" />
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('beranda')}>
              <div className="w-9 h-9 bg-[#003b5a] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Waves className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base md:text-lg font-display font-extrabold text-[#003b5a] leading-none tracking-tight">
                  Siaga Banjir
                </h1>
                <span className="text-[10px] font-sans text-[#006d37] font-semibold uppercase tracking-wider leading-none mt-0.5">
                  Gajah Wong
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button 
              id="nav-beranda"
              onClick={() => scrollToSection('beranda')} 
              className={`font-sans text-sm font-semibold tracking-wide pb-1 transition-all ${
                activeTab === 'beranda' ? 'text-[#003b5a] border-b-2 border-[#003b5a]' : 'text-[#41474e] hover:text-[#003b5a]'
              }`}
            >
              Beranda
            </button>
            <button 
              id="nav-sungai"
              onClick={() => scrollToSection('tentang')} 
              className={`font-sans text-sm font-semibold tracking-wide pb-1 transition-all ${
                activeTab === 'sungai' ? 'text-[#003b5a] border-b-2 border-[#003b5a]' : 'text-[#41474e] hover:text-[#003b5a]'
              }`}
            >
              Tentang Sungai
            </button>
            <button 
              id="nav-risiko"
              onClick={() => scrollToSection('risiko')} 
              className={`font-sans text-sm font-semibold tracking-wide pb-1 transition-all ${
                activeTab === 'risiko' ? 'text-[#003b5a] border-b-2 border-[#003b5a]' : 'text-[#41474e] hover:text-[#003b5a]'
              }`}
            >
              Risiko Bahaya
            </button>
            <button 
              id="nav-edukasi"
              onClick={() => scrollToSection('darurat')} 
              className={`font-sans text-sm font-semibold tracking-wide pb-1 transition-all ${
                activeTab === 'edukasi' ? 'text-[#003b5a] border-b-2 border-[#003b5a]' : 'text-[#41474e] hover:text-[#003b5a]'
              }`}
            >
              Mitigasi & Edukasi
            </button>
            <a
              id="btn-open-dashboard"
              href={MONITORING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#003b5a] text-white px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase shadow-md hover:bg-[#1a5276] hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Monitoring
            </a>
          </nav>

          <div className="md:hidden flex items-center">
            <a
              id="btn-open-dashboard-mobile"
              href={MONITORING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#003b5a] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3 h-3 animate-pulse" />
              Monitor
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Drawer (Mobile SideNav) */}
      <div className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute top-0 left-0 w-[280px] h-full bg-[#e3efff] py-6 px-5 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div>
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#c1c7cf]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#003b5a] rounded-lg flex items-center justify-center text-white">
                  <Waves className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#003b5a] leading-none">Siaga Gajah Wong</span>
                  <span className="text-[9px] text-[#006d37] font-semibold uppercase tracking-wider mt-0.5">Yogyakarta</span>
                </div>
              </div>
              <button 
                id="btn-close-menu"
                className="p-1.5 rounded-full hover:bg-[#edf4ff] text-[#41474e]" 
                onClick={() => setIsNavOpen(false)}
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button 
                id="drawer-home"
                onClick={() => scrollToSection('beranda')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <Home className="w-4.5 h-4.5 text-[#003b5a]" />
                Beranda Utama
              </button>
              <button 
                id="drawer-about"
                onClick={() => scrollToSection('tentang')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <BookOpen className="w-4.5 h-4.5 text-[#003b5a]" />
                Profil Sungai Gajah Wong
              </button>
              <button 
                id="drawer-danger"
                onClick={() => scrollToSection('risiko')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <AlertTriangle className="w-4.5 h-4.5 text-[#003b5a]" />
                Analisis Risiko Banjir
              </button>
              <button 
                id="drawer-edu"
                onClick={() => scrollToSection('darurat')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <ShieldAlert className="w-4.5 h-4.5 text-[#003b5a]" />
                Panduan Mitigasi Bencana
              </button>
              <button 
                id="drawer-evac"
                onClick={() => scrollToSection('evakuasi')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <MapPin className="w-4.5 h-4.5 text-[#003b5a]" />
                Jalur & Titik Evakuasi
              </button>
              <button 
                id="drawer-faq"
                onClick={() => scrollToSection('faq')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#091d2e] hover:bg-[#d1e4fb] transition-all text-left"
              >
                <HelpCircle className="w-4.5 h-4.5 text-[#003b5a]" />
                Pertanyaan Umum / FAQ
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-[#c1c7cf]/40">
            <a
              id="drawer-open-monitor"
              href={MONITORING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsNavOpen(false)}
              className="w-full bg-[#003b5a] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-[#1a5276] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4.5 h-4.5 animate-pulse" />
              MONITORING AIR
            </a>
            <p className="text-[10px] text-center text-[#41474e] mt-4 opacity-75">
              © 2026 Siaga Banjir Gajah Wong
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="beranda" className="relative min-h-screen pt-24 pb-16 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Pemandangan Sungai Gajah Wong Yogyakarta" 
            className="w-full h-full object-cover object-center scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCytBE8yohKpg-pWVw8HVWwod0l9GCnxVrkPn8ut_folMm_KzTq2KT8hAT8Ss_wtpJc7MFn_ELhxiRn1puSP_YI7-PzNURlNj531M70TIsCYewEKJfbWy9YRrcgcmHBibr2YuDwGg00ov2Gjtc043gep53g3TQtlrxWFBLrON3iZsGLMmcJEIOEEMSGPdMI6Sf7rx-6oeKJ3TGPi-GMd8Np0S1xltK-ae2Wi9xqdTpCfTt7Wy7ofZMDpln71EtmWUThSw"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-3xl text-white space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#006d37]/35 border border-[#6bfe9c]/40 backdrop-blur-md px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6bfe9c] animate-pulse"></span>
              <span className="text-xs md:text-sm font-sans font-semibold uppercase tracking-wider text-[#6bfe9c]">
                Siaga & Waspada Bencana
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight text-white tracking-tight drop-shadow-sm">
              Pusat Informasi Siaga Banjir Sungai Gajah Wong
            </h2>

            <p className="text-base md:text-xl font-sans text-white/90 font-normal leading-relaxed max-w-2xl drop-shadow-sm">
              Platform terpadu untuk monitoring ketinggian air, edukasi mitigasi, dan panduan darurat bagi masyarakat di sepanjang aliran bantaran Sungai Gajah Wong Yogyakarta.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                id="btn-explore-info"
                onClick={() => scrollToSection('tentang')}
                className="bg-[#006d37] hover:bg-[#005228] text-white px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                Jelajahi Informasi 
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                id="btn-monitor-hero"
                href={MONITORING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-md px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase active:scale-95 transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 animate-pulse" />
                Live Monitoring TMA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-24 md:space-y-32">
        
        {/* Tentang Sungai Gajah Wong */}
        <section id="tentang" className="scroll-mt-24">
          <div className="mb-10">
            <span className="text-[#006d37] font-sans text-xs font-bold tracking-widest uppercase mb-2 block">
              Profil Wilayah
            </span>
            <h3 className="text-2xl md:text-4xl font-display font-bold text-[#003b5a] tracking-tight">
              Tentang Sungai Gajah Wong
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <p className="text-base md:text-lg font-sans text-[#41474e] leading-relaxed">
                Sungai Gajah Wong merupakan salah satu sungai strategis di Daerah Istimewa Yogyakarta yang melintasi pemukiman padat penduduk. Hulu sungai ini berada di lereng selatan Gunung Merapi, mengalir ke selatan melintasi wilayah Sleman, Kota Yogyakarta, hingga bermuara di Sungai Opak di Bantul. Keberadaannya bukan sekadar aliran air, melainkan urat nadi sosial, budaya, dan ekonomi bagi ribuan warga yang tinggal di tepiannya.
              </p>
              
              <div className="bg-[#edf4ff] p-6 md:p-8 rounded-2xl border border-[#c1c7cf]/40 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#003b5a] rounded-lg flex items-center justify-center text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#6bfe9c]" />
                  </div>
                  <h4 className="text-lg font-display font-bold text-[#003b5a]">
                    Peran Komunitas (SEGAR)
                  </h4>
                </div>
                <p className="text-sm md:text-base font-sans text-[#41474e] leading-relaxed">
                  Masyarakat di bantaran Gajah Wong memiliki kearifan lokal luar biasa dalam menjaga ekosistem sungai. Melalui Forum Komunitas SEGAR (Sekretariat Bersama Gajah Wong Lestari) dan program Kampung Tangguh Bencana (KTB), warga berkolaborasi aktif dengan pemerintah untuk melakukan pemantauan debit air, penanaman pohon penahan longsor, serta sosialisasi mitigasi bencana mandiri.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl shadow-lg min-h-[300px] lg:min-h-full">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="Sungai Gajah Wong di kawasan Kotagede" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOSytJWe472r7YUFKlGT-1Mo-cLULj13XoGEUHso3d0a95gizD8hYTnGcntonmitHwgFhNETFcEUrBRgB6cvhlnlwYNmsGfXpHkOp1blJATXOhzgQ7hGbt-rUcdBLOlpph4_hjwzAzO3qKxZ8MFM3ytZIOZc2LOz7T56x80aqKlERf5vuPMC3cwpZLQMgP8nNz1baIt3S49e07MjqBl07rnug7-EhFuWIDHbm6_TqgRPUcdMENt-zC" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-xs font-semibold uppercase text-[#6bfe9c] tracking-wider mb-1 block">
                  Kawasan Padat Bantaran
                </span>
                <p className="text-xl font-display font-bold text-white drop-shadow-md">
                  Kawasan Kotagede & Sekitarnya
                </p>
                <p className="text-xs text-white/85 mt-1">
                  Karakteristik alur sungai yang berkelok-kelok dan melintasi kawasan bersejarah cagar budaya Yogyakarta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Potensi Risiko Banjir */}
        <section id="risiko" className="scroll-mt-24 border-t border-[#c1c7cf]/35 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6 order-1">
              <span className="text-[#ba1a1a] font-sans text-xs font-bold tracking-widest uppercase block">
                Analisis Bahaya
              </span>
              <h3 className="text-2xl md:text-4xl font-display font-bold text-[#003b5a] tracking-tight">
                Potensi Risiko Banjir
              </h3>
              <p className="text-base md:text-lg font-sans text-[#41474e] leading-relaxed">
                Luapan banjir di Sungai Gajah Wong sering kali berupa banjir kiriman kilat (flash flood) dari wilayah hulu utara Sleman akibat curah hujan ekstrem, serta hambatan aliran lokal. Menyadari tanda bahaya sejak awal sangat penting untuk mempercepat waktu reaksi warga:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4 p-4 rounded-xl bg-white border border-[#c1c7cf]/40 shadow-sm hover:border-[#ba1a1a]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] flex-shrink-0">
                    <span className="text-xs font-bold font-sans">1</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#091d2e] text-sm md:text-base">Kenaikan Cepat Tinggi Muka Air</h5>
                    <p className="text-xs md:text-sm text-[#41474e] mt-0.5">Air jembatan pengamatan melampaui batas normal harian dalam kurun waktu singkat.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white border border-[#c1c7cf]/40 shadow-sm hover:border-[#ba1a1a]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] flex-shrink-0">
                    <span className="text-xs font-bold font-sans">2</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#091d2e] text-sm md:text-base">Perubahan Warna & Bau Air</h5>
                    <p className="text-xs md:text-sm text-[#41474e] mt-0.5">Air mendadak berubah menjadi sangat pekat coklat tua berlumpur tebal disertai sampah serasah kayu.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white border border-[#c1c7cf]/40 shadow-sm hover:border-[#ba1a1a]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] flex-shrink-0">
                    <span className="text-xs font-bold font-sans">3</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#091d2e] text-sm md:text-base">Suara Gemuruh Mistis</h5>
                    <p className="text-xs md:text-sm text-[#41474e] mt-0.5">Terdengar dentuman bebatuan yang berbenturan di dasar sungai serta suara deru angin yang tidak wajar dari arah hulu.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 order-2">
              <div className="bg-[#ffdad6]/20 p-6 md:p-8 rounded-2xl border-l-4 border-[#ba1a1a] flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-display font-bold text-[#003b5a] mb-2">Curah Hujan Tinggi</h4>
                  <p className="text-sm font-sans text-[#41474e] leading-relaxed">
                    Intensitas curah hujan tinggi (&gt;50 mm/jam) di lereng Merapi mempercepat pengumpulan debit limpasan permukaan yang mengalir langsung ke badan Sungai Gajah Wong.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mt-6">
                  Faktor Utama
                </span>
              </div>

              <div className="bg-[#ffdad6]/20 p-6 md:p-8 rounded-2xl border-l-4 border-[#ba1a1a] flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-display font-bold text-[#003b5a] mb-2">Penyempitan & Pendangkalan</h4>
                  <p className="text-sm font-sans text-[#41474e] leading-relaxed">
                    Sedimentasi pasir sisa erapi dan sumbatan sampah padat harian di belokan sungai mengurangi kapasitas penampang basah aliran air harian.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mt-6">
                  Faktor Sekunder
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Panduan Tanggap Darurat */}
        <section id="darurat" className="scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#003b5a] font-sans text-xs font-bold tracking-widest uppercase mb-2 block">
              Prosedur Standard Operasional (SOP)
            </span>
            <h3 className="text-2xl md:text-4xl font-display font-bold text-[#003b5a] tracking-tight">
              Panduan Tanggap Darurat Banjir
            </h3>
            <p className="text-sm md:text-base font-sans text-[#41474e] mt-3 leading-relaxed">
              Langkah-langkah taktis dan sistematis terbagi dalam tiga fase utama bencana demi menyelamatkan diri, keluarga, serta harta benda Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Sebelum */}
            <div className="bg-white p-8 rounded-3xl border border-[#c1c7cf]/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-12 h-12 bg-[#6bfe9c]/30 text-[#00743a] rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined font-bold text-2xl">clinical_notes</span>
                </div>
                <h4 className="text-lg md:text-xl font-display font-extrabold text-[#003b5a] mb-4">
                  1. Pra-Bencana (Sebelum)
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Menyiapkan Tas Siaga Bencana (TSB) keluarga di tempat gampang digapai.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Meletakkan dokumen akta tanah, ijazah, dan surat berharga ke map kedap air ditaruh lemari paling atas.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Bergabung dalam grup WA darurat warga untuk memantau status stasiun pintu air.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 border-t border-[#c1c7cf]/30 mt-8">
                <span className="text-xs font-bold text-[#00743a] bg-[#6bfe9c]/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Fase Kesiapsiagaan
                </span>
              </div>
            </div>

            {/* Saat */}
            <div className="bg-[#003b5a] text-white p-8 rounded-3xl border border-[#1a5276] shadow-xl flex flex-col justify-between transform lg:scale-105 z-10">
              <div>
                <div className="w-12 h-12 bg-[#94c5ee]/30 text-[#94c5ee] rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined font-bold text-2xl">campaign</span>
                </div>
                <h4 className="text-lg md:text-xl font-display font-extrabold text-white mb-4">
                  2. Tanggap Darurat (Saat)
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5 text-sm font-sans text-white/90">
                    <span className="text-[#6bfe9c] font-extrabold text-lg leading-none">•</span>
                    <span>Segera matikan sekring utama aliran listrik PLN di dalam rumah dan tutup keran gas LPG.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-white/90">
                    <span className="text-[#6bfe9c] font-extrabold text-lg leading-none">•</span>
                    <span>Patuhi instruksi ketua RT/RW/Relawan KTB untuk mengungsi ke tempat kumpul evakuasi yang aman.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-white/90">
                    <span className="text-[#6bfe9c] font-extrabold text-lg leading-none">•</span>
                    <span>DILARANG berjalan kaki, menyeberang, atau berkendara menerobos derasnya arus banjir bantaran sungai.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 border-t border-[#1a5276] mt-8">
                <span className="text-xs font-bold text-[#6bfe9c] bg-[#6bfe9c]/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Fase Penyelamatan
                </span>
              </div>
            </div>

            {/* Setelah */}
            <div className="bg-white p-8 rounded-3xl border border-[#c1c7cf]/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-12 h-12 bg-[#6bfe9c]/30 text-[#00743a] rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined font-bold text-2xl">cleaning_services</span>
                </div>
                <h4 className="text-lg md:text-xl font-display font-extrabold text-[#003b5a] mb-4">
                  3. Pasca-Bencana (Setelah)
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Pastikan instalasi kabel listrik rumah kering sepenuhnya sebelum menyalakan saklar stop kontak.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Gunakan sepatu boots karet & desinfektan kimia saat membersihkan sisa endapan lumpur banjir.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm font-sans text-[#41474e]">
                    <span className="text-[#00743a] font-extrabold text-lg leading-none">•</span>
                    <span>Cek kelayakan sumur air minum jikalau tercemar air banjir, kuras dlu agar terhindar penyakit diare.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 border-t border-[#c1c7cf]/30 mt-8">
                <span className="text-xs font-bold text-[#00743a] bg-[#6bfe9c]/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Fase Pemulihan
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Jalur & Titik Evakuasi + Kalkulator */}
        <section id="evakuasi" className="scroll-mt-24">
          <div className="bg-[#d9eaff] rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-xl">
            <div className="lg:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-between space-y-8">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#003b5a]/10 text-[#003b5a] px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#003b5a]" /> Rekomendasi Jalur
                </div>
                <h3 className="text-2xl md:text-4xl font-display font-bold text-[#003b5a] leading-tight">
                  Jalur & Titik Evakuasi
                </h3>
                <p className="text-sm md:text-base font-sans text-[#41474e] mt-4 leading-relaxed">
                  Keselamatan jiwa warga adalah prioritas absolut. Kenali rute tercepat dari lokasi hunian Anda menuju titik kumpul aman (assembly point) yang berada jauh dari area rawan luapan air banjir.
                </p>

                <div className="space-y-6 mt-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#003b5a] text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-[#003b5a] text-base">Cek Rambu Petunjuk Evakuasi</h5>
                      <p className="text-sm text-[#41474e] mt-1">Ikuti rambu penunjuk jalur evakuasi resmi berwarna kuning-hijau menyala yang dipasang di sepanjang tiang listrik gang pemukiman warga.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#003b5a] text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-[#003b5a] text-base">Menuju Tempat Kumpul Utama</h5>
                      <p className="text-sm text-[#41474e] mt-1">Gedung evakuasi dirancang di dataran tinggi, berupa balai rukun warga, gedung sekolah, halaman masjid besar, atau fasilitas publik berlantai dua.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="lg:w-1/2 min-h-[380px] relative">
              <div className="w-full h-[420px] rounded-[32px] overflow-hidden shadow-lg border border-[#c1c7cf]/30" ref={assemblyMapRef} />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-[#003b5a] shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#006d37] rounded-full animate-pulse"></span>
                Peta Titik Kumpul Evakuasi
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 border border-[#c1c7cf]/40 rounded-3xl p-4 shadow-sm text-[12px] text-[#41474e]">
                <p className="font-bold text-[#003b5a] mb-2">Koordinat Titik Kumpul</p>
                <ul className="list-decimal pl-5 space-y-1">
                  {ASSEMBLY_POINTS.map((point) => (
                    <li key={point.id}>
                      <span className="font-semibold text-[#003b5a]">{point.name}</span>: {point.lat.toFixed(9)}, {point.lng.toFixed(9)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Nomor Kontak Darurat */}
        <section id="kontak" className="scroll-mt-24">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#c1c7cf]/40 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <span className="text-[#ba1a1a] font-sans text-xs font-bold tracking-widest uppercase mb-1 block">
                  Butuh Bantuan Segera?
                </span>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-[#003b5a] tracking-tight">
                  Nomor Kontak Darurat
                </h3>
              </div>
              <div className="px-4 py-2 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-xs font-bold flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                Hubungi Langsung Dari HP Anda
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <a 
                id="call-bpbd"
                href="tel:112" 
                className="p-6 rounded-2xl bg-[#f7f9ff] border border-[#c1c7cf]/30 hover:border-[#ba1a1a]/40 hover:bg-[#ffdad6]/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-[#41474e] text-xs uppercase tracking-wider">BPBD DIY</h5>
                  <p className="text-2xl md:text-3xl font-display font-extrabold text-[#003b5a] mt-1 group-hover:text-[#ba1a1a] transition-colors">
                    112
                  </p>
                </div>
                <span className="text-[10px] font-sans text-[#41474e]/70 mt-4 flex items-center gap-1 group-hover:text-[#ba1a1a] transition-colors">
                  Klik untuk panggil darurat &rarr;
                </span>
              </a>

              <a 
                id="call-ambulans"
                href="tel:118" 
                className="p-6 rounded-2xl bg-[#f7f9ff] border border-[#c1c7cf]/30 hover:border-[#ba1a1a]/40 hover:bg-[#ffdad6]/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined font-bold text-xl">medical_services</span>
                  </div>
                  <h5 className="font-bold text-[#41474e] text-xs uppercase tracking-wider">Ambulans</h5>
                  <p className="text-2xl md:text-3xl font-display font-extrabold text-[#003b5a] mt-1 group-hover:text-[#ba1a1a] transition-colors">
                    118
                  </p>
                </div>
                <span className="text-[10px] font-sans text-[#41474e]/70 mt-4 flex items-center gap-1 group-hover:text-[#ba1a1a] transition-colors">
                  Klik untuk panggil medis &rarr;
                </span>
              </a>

              <a 
                id="call-polres"
                href="tel:110" 
                className="p-6 rounded-2xl bg-[#f7f9ff] border border-[#c1c7cf]/30 hover:border-[#ba1a1a]/40 hover:bg-[#ffdad6]/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined font-bold text-xl">local_police</span>
                  </div>
                  <h5 className="font-bold text-[#41474e] text-xs uppercase tracking-wider">Polresta Jogja</h5>
                  <p className="text-2xl md:text-3xl font-display font-extrabold text-[#003b5a] mt-1 group-hover:text-[#ba1a1a] transition-colors">
                    110
                  </p>
                </div>
                <span className="text-[10px] font-sans text-[#41474e]/70 mt-4 flex items-center gap-1 group-hover:text-[#ba1a1a] transition-colors">
                  Klik untuk panggil polisi &rarr;
                </span>
              </a>

              <a 
                id="call-damkar"
                href="tel:0274587101" 
                className="p-6 rounded-2xl bg-[#f7f9ff] border border-[#c1c7cf]/30 hover:border-[#ba1a1a]/40 hover:bg-[#ffdad6]/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined font-bold text-xl">fire_truck</span>
                  </div>
                  <h5 className="font-bold text-[#41474e] text-xs uppercase tracking-wider">Damkar DIY</h5>
                  <p className="text-lg md:text-xl font-display font-extrabold text-[#003b5a] mt-2 group-hover:text-[#ba1a1a] transition-colors leading-tight">
                    (0274) 587101
                  </p>
                </div>
                <span className="text-[10px] font-sans text-[#41474e]/70 mt-4 flex items-center gap-1 group-hover:text-[#ba1a1a] transition-colors">
                  Klik untuk panggil damkar &rarr;
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Block: Monitoring & Alert WhatsApp Registration */}
        <section id="cta-monitoring">
          <div className="relative rounded-[32px] bg-[#1a5276] p-8 md:p-16 overflow-hidden shadow-xl text-white">
            <div className="absolute -top-10 -right-10 opacity-10">
              <Waves className="w-96 h-96 text-white" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-6">
              <h3 className="text-2xl md:text-4xl font-display font-extrabold text-white leading-tight">
                Pantau Ketinggian Muka Air Secara Real-Time
              </h3>
              <p className="text-sm md:text-lg text-white/90 font-sans leading-relaxed">
                Gunakan dashboard monitoring interaktif kami untuk melacak data historis, grafik TMA harian, serta mendaftarkan nomor telepon Anda ke system SMS/WhatsApp Warning System untuk peringatan otomatis.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  id="btn-open-monitor-cta"
                  href={MONITORING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#6bfe9c] hover:bg-[#4ae183] text-[#00210c] px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  Buka Monitoring Air
                  <span className="material-symbols-outlined font-bold text-lg">launch</span>
                </a>
                <a 
                  id="btn-scroll-faq"
                  onClick={() => scrollToSection('faq')}
                  className="bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-md px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  Baca Pertanyaan Umum (FAQ)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pertanyaan Umum (FAQ Accordion with Search) */}
        <section id="faq" className="max-w-4xl mx-auto scroll-mt-24">
          <div className="text-center mb-10">
            <span className="text-[#006d37] font-sans text-xs font-bold tracking-widest uppercase mb-1 block">
              Butuh Informasi Tambahan?
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-[#003b5a] tracking-tight">
              Pertanyaan Umum (FAQ)
            </h3>
            
            {/* FAQ Search Bar */}
            <div className="max-w-md mx-auto mt-6 relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#72787f]" />
              <input 
                id="faq-search-input"
                type="text"
                placeholder="Cari pertanyaan atau kata kunci..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full bg-white text-sm border border-[#c1c7cf] rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#003b5a] text-[#091d2e]"
              />
              {faqSearch && (
                <button 
                  id="btn-clear-faq-search"
                  onClick={() => setFaqSearch('')}
                  className="absolute right-3 top-3 text-xs text-[#72787f] hover:text-[#091d2e]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-[#c1c7cf]/40 rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
                  >
                    <button 
                      id={`faq-toggle-${idx}`}
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center p-5 md:p-6 text-left hover:bg-[#edf4ff]/40 transition-colors"
                    >
                      <span className="font-bold text-[#003b5a] text-sm md:text-base pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[#003b5a] transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[300px] border-t border-[#c1c7cf]/20' : 'max-h-0'
                      } overflow-hidden`}
                    >
                      <p className="p-5 md:p-6 text-sm md:text-base font-sans text-[#41474e] bg-[#edf4ff]/10 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white border border-[#c1c7cf]/40 rounded-2xl">
                <p className="text-sm text-[#41474e]">Tidak menemukan pertanyaan yang cocok dengan pencarian Anda.</p>
                <button 
                  id="btn-reset-faq-search"
                  onClick={() => setFaqSearch('')} 
                  className="mt-3 text-xs font-bold text-[#003b5a] underline"
                >
                  Tampilkan Semua
                </button>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#003b5a] text-white py-16 px-4 md:px-8 border-t border-[#1a5276]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 mb-8 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#edf4ff]/10 text-white rounded-lg flex items-center justify-center shadow-sm">
                  <Waves className="w-5 h-5 text-[#6bfe9c]" />
                </div>
                <h4 className="text-lg md:text-xl font-display font-extrabold text-white">
                  Siaga Banjir Gajah Wong
                </h4>
              </div>
              <p className="text-xs md:text-sm text-white/80 font-sans leading-relaxed max-w-sm">
                Layanan informasi mitigasi bencana banjir berbasis masyarakat untuk kelestarian dan keselamatan warga di sepanjang aliran bantaran Sungai Gajah Wong Yogyakarta.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#6bfe9c]">Tautan Link</h5>
                <nav className="flex flex-col gap-2 text-xs md:text-sm text-white/70">
                  <button onClick={() => scrollToSection('beranda')} className="text-left hover:text-white transition-colors">Beranda</button>
                  <button onClick={() => scrollToSection('tentang')} className="text-left hover:text-white transition-colors">Tentang Sungai</button>
                  <button onClick={() => scrollToSection('risiko')} className="text-left hover:text-white transition-colors">Risiko Bahaya</button>
                  <button onClick={() => scrollToSection('darurat')} className="text-left hover:text-white transition-colors">Mitigasi Bencana</button>
                </nav>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#6bfe9c]">Kebijakan</h5>
                <nav className="flex flex-col gap-2 text-xs md:text-sm text-white/70">
                  <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
                  <a href="#" className="hover:text-white transition-colors">Kontak Developer</a>
                  <a href="#" className="hover:text-white transition-colors">Ketentuan Layanan</a>
                </nav>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#6bfe9c]">Kontak BPBD DIY</h5>
                <p className="text-xs text-white/70 font-sans">
                  Jl. Kenari No.14A, Semaki, Umbulharjo, Yogyakarta, 55165
                </p>
                <p className="text-xs text-[#6bfe9c] font-bold mt-1">
                  Hotline: (0274) 555584
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[11px] text-white/60 text-center md:text-left leading-relaxed">
              &copy; 2026 Pusat Informasi Siaga Banjir Sungai Gajah Wong. Didukung secara sinergis oleh gerakan SEGAR dan KKT-PPM Universitas Gadjah Mada (UGM).
            </p>
            <div className="flex gap-6 items-center opacity-70">
              <img 
                className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all object-contain" 
                alt="Logo gerakan SEGAR Yogyakarta" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2piYRPMfKXMHXFvmAU5mITzK_8spoxIo8SHJfVnMy_iI4EA3J73Buv_ABkcv1qnq6MNg9ypzUb7m5mOlClzIxeinz4NVahSIJVav7WQ9WNTY9OPV8FiohtRH4sikxBz89kQAQiT8Ap70Eojv6G3RJyWIIiz1UUrrAYs6lLBkPysPwC_i98WvTaAvC6qwwW3XH1ZWCsG4aevcsOXi0zL-wQyHXuXL9nuiw7FyTf5wTQitDe1XxX0_G" 
              />
              <img 
                className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all object-contain" 
                alt="Logo KKN-PPM Universitas Gadjah Mada" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBx0PLoEXH8CKwYfjaN48OhCXKzN1OJh5vT7eCR3HOSzihiCn1H1WFy6ER0wasNGQIq18q5SVevOePSbGWmnrvBg3TxF9Pr3bxt07bHL3bTLVED95wQLbCLzjW-viqnQ5EZLS4Ksy4HVMX9VyxPEhZvUpb4DgOHG59oaLOhyA4jBFupWkvUW-ThZ1FW4jDpKUR0xrzd-Hk3WJtp1Zp3nzK2Nz0m6mXTVoc-NH1lHmXA5DaJyORqoZbH" 
              />
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================= */}
      {/* MODAL OVERLAY: FULL INTERACTIVE MONITORING DASHBOARD */}
      {/* ============================================================= */}
      {isDashboardOpen && (
        <div className="fixed inset-0 z-[70] bg-[#091d2e]/85 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 transition-all">
          <div className="bg-[#f7f9ff] w-full max-w-5xl h-full md:h-[90vh] md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative border border-[#c1c7cf]/40 animate-scale-up">
            
            {/* Dashboard Header */}
            <div className="bg-[#003b5a] text-white px-5 md:px-8 py-5 flex items-center justify-between border-b border-[#1a5276]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#6bfe9c]" />
                </div>
                <div>
                  <h3 className="text-base md:text-xl font-display font-extrabold text-white">
                    Pusat Monitoring TMA Gajah Wong
                  </h3>
                  <p className="text-[10px] md:text-xs text-[#94c5ee] font-sans">
                    Sistem Pemantauan Terpadu &bull; Live Telemetri IoT Ultrasonik
                  </p>
                </div>
              </div>
              <button 
                id="btn-close-dashboard"
                onClick={() => setIsDashboardOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-all active:scale-95"
                aria-label="Tutup Dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              
              {/* Alert status banner for whole river if simulated rain is on */}
              {isHeavyRainSimulated && (
                <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 md:p-5 flex items-start gap-3.5 animate-pulse text-xs md:text-sm">
                  <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-red-800 font-extrabold uppercase tracking-wide">Peringatan: Simulasi Hujan Lebat Aktif!</p>
                    <p className="text-red-700 font-sans leading-relaxed">
                      Kondisi cuaca di hulu terdeteksi hujan lebat berkepanjangan dengan intensitas harian mencapai {simulatedRainIntensity} mm/jam. Tinggi air di seluruh pintu air meningkat drastis. Warga dihimbau mengungsi segera jikalau tanda sirine diaktifkan!
                    </p>
                  </div>
                </div>
              )}

              {/* Station Selection Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {STATIONS.map((st) => {
                  const currentLevel = getCurrentTMA(st.id);
                  const stat = getStatusInfo(st.id, currentLevel);
                  const isSel = activeStation === st.id;
                  
                  return (
                    <button
                      key={st.id}
                      id={`tab-station-${st.id}`}
                      onClick={() => setActiveStation(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSel 
                          ? 'bg-white border-[#003b5a] shadow-sm ring-2 ring-[#003b5a]/10' 
                          : 'bg-[#edf4ff]/50 border-[#c1c7cf]/40 hover:bg-[#edf4ff] hover:border-[#c1c7cf]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] md:text-xs font-bold uppercase ${isSel ? 'text-[#003b5a]' : 'text-[#41474e]'}`}>
                          {st.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
                      </div>
                      <p className="text-lg md:text-2xl font-display font-extrabold text-[#003b5a]">
                        {currentLevel} <span className="text-xs font-normal text-[#41474e]">cm</span>
                      </p>
                      <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded ${stat.badge} inline-block mt-1 font-semibold`}>
                        {stat.text.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Station Detail Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Level Gauge (Liquid-style) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#c1c7cf]/40 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#003b5a] mb-1">Gauge Visual TMA</h4>
                    <p className="text-[11px] text-[#41474e] mb-4">Pengukuran vertikal fisik sensor jembatan</p>
                  </div>

                  {/* Physical gauge rendering */}
                  <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex flex-col justify-end">
                    
                    {/* Scale tick marks */}
                    <div className="absolute inset-y-0 left-2 w-4 flex flex-col justify-between text-[9px] font-mono text-slate-400 py-3 z-20">
                      <span>250</span>
                      <span>200</span>
                      <span>150</span>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>

                    {/* Water container */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-end">
                      <div 
                        className="w-full bg-gradient-to-t from-[#003b5a]/80 to-[#2f6388]/90 relative transition-all duration-700 shadow-inner"
                        style={{ height: `${Math.min(100, (currentTMA / 250) * 100)}%` }}
                      >
                        {/* Interactive wave line */}
                        <div className="absolute -top-1.5 left-0 w-full h-3 bg-sky-300/40 animate-pulse rounded-t-full"></div>
                        <div className="absolute top-2 left-0 right-0 text-center text-white font-mono text-sm font-extrabold drop-shadow-md">
                          {currentTMA} cm
                        </div>
                      </div>
                    </div>

                    {/* Warning Levels Indicators on right border */}
                    <div className="absolute inset-y-0 right-1 w-2 flex flex-col justify-between py-2 z-10">
                      <div className="h-1/5 w-full bg-red-600/30 border-r border-red-500" title="Darurat &gt;200cm"></div>
                      <div className="h-1/5 w-full bg-amber-500/30 border-r border-amber-400" title="Siaga &gt;150cm"></div>
                      <div className="h-1/5 w-full bg-yellow-400/30 border-r border-yellow-300" title="Waspada &gt;100cm"></div>
                      <div className="h-2/5 w-full bg-emerald-500/10" title="Aman"></div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between text-[11px] text-[#41474e] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <p>Status: <span className={statusInfo.textClass}>{statusInfo.text}</span></p>
                      <p className="mt-0.5 text-[10px]">Pintu air: {activeStationData.location}</p>
                    </div>
                  </div>
                </div>

                {/* Status card, description, and Simulation controls */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Status Banner */}
                  <div className={`p-5 rounded-2xl border ${statusInfo.alertClass} flex flex-col justify-between h-auto`}>
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-sm uppercase tracking-wider">Hasil Analisa Sensor Terakhir</h4>
                        <p className="font-display font-black text-xl md:text-2xl mt-1">Status: {statusInfo.text}</p>
                        <p className="text-xs md:text-sm font-sans mt-2 opacity-90 leading-relaxed">
                          {statusInfo.desc}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 text-[11px] opacity-80 border-t border-[#c1c7cf]/40 pt-3 flex justify-between items-center">
                      <span>Diperbarui: Baru saja (Setiap 5 menit otomatis)</span>
                      <button 
                        onClick={() => {
                          const originalRain = isHeavyRainSimulated;
                          setIsHeavyRainSimulated(!originalRain);
                        }}
                        className="text-xs font-bold underline text-[#003b5a]"
                      >
                        Paksa Refresh Sensor
                      </button>
                    </div>
                  </div>

                  {/* Water Levels Trends (Historical SVG Chart simulation) */}
                  <div className="bg-white p-5 rounded-2xl border border-[#c1c7cf]/40">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#003b5a] flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-[#006d37]" /> Grafik Tren TMA (6 Jam Terakhir)
                        </h4>
                        <p className="text-[10px] text-[#41474e]">Perkembangan fluktuasi air per jam</p>
                      </div>
                      <span className="text-[9px] bg-[#edf4ff] text-[#003b5a] px-2 py-1 rounded font-bold uppercase">
                        Stasiun: {activeStationData.name.split(' ')[0]}
                      </span>
                    </div>

                    {/* Highly responsive custom SVG Chart */}
                    <div className="h-44 w-full bg-slate-50 rounded-xl relative border border-slate-200/50 p-2 flex flex-col justify-between">
                      {/* Gridlines */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-slate-200/40 z-0"></div>
                      <div className="absolute inset-x-0 top-2/4 border-b border-slate-200/40 z-0"></div>
                      <div className="absolute inset-x-0 top-3/4 border-b border-slate-200/40 z-0"></div>

                      {/* SVG Line path rendering based on station and simulation */}
                      <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 600 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2f6388" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#2f6388" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Danger zone line */}
                        <line x1="0" y1="30" x2="600" y2="30" stroke="#ba1a1a" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                        <text x="5" y="25" fill="#ba1a1a" className="text-[8px] font-sans font-bold">Darurat (Warning Line)</text>

                        {/* Chart Line Path */}
                        {isHeavyRainSimulated ? (
                          <>
                            <path 
                              d="M 0,110 Q 100,100 200,80 T 400,45 T 600,28" 
                              fill="none" 
                              stroke="#003b5a" 
                              strokeWidth="3.5" 
                              strokeLinecap="round"
                            />
                            <path 
                              d="M 0,110 Q 100,100 200,80 T 400,45 T 600,28 L 600,150 L 0,150 Z" 
                              fill="url(#chartGrad)"
                            />
                          </>
                        ) : (
                          <>
                            <path 
                              d="M 0,115 Q 100,112 200,118 T 400,110 T 600,112" 
                              fill="none" 
                              stroke="#003b5a" 
                              strokeWidth="3.5" 
                              strokeLinecap="round"
                            />
                            <path 
                              d="M 0,115 Q 100,112 200,118 T 400,110 T 600,112 L 600,150 L 0,150 Z" 
                              fill="url(#chartGrad)"
                            />
                          </>
                        )}

                        {/* Dynamic point markers */}
                        <circle cx="600" cy={isHeavyRainSimulated ? 28 : 112} r="5" fill="#006d37" className="animate-ping" />
                        <circle cx="600" cy={isHeavyRainSimulated ? 28 : 112} r="4" fill="#003b5a" />
                      </svg>

                      {/* X-Axis labels */}
                      <div className="w-full flex justify-between text-[9px] font-mono text-slate-400 pt-36 px-2 z-20">
                        <span>-6 Jam</span>
                        <span>-4 Jam</span>
                        <span>-2 Jam</span>
                        <span>-1 Jam</span>
                        <span>Sekarang (Live)</span>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE CONTROLS: SIMULATION ENGINE PANEL */}
                  <div className="bg-[#e3efff] p-5 rounded-2xl border border-[#c1c7cf]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#003b5a] flex items-center gap-1.5 uppercase tracking-wide">
                          <Flame className="w-4.5 h-4.5 text-[#ba1a1a]" />
                          Modul Simulasi Cuaca Ekstrem
                        </h4>
                        <p className="text-[11px] text-[#41474e]">Uji respons mitigasi bencana secara real-time</p>
                      </div>
                      <button 
                        id="btn-toggle-rain-sim"
                        onClick={() => setIsHeavyRainSimulated(!isHeavyRainSimulated)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isHeavyRainSimulated 
                            ? 'bg-[#ba1a1a] text-white animate-pulse' 
                            : 'bg-white text-[#ba1a1a] border border-[#ba1a1a]/40 hover:bg-[#ffdad6]/20'
                        }`}
                      >
                        {isHeavyRainSimulated ? '■ Hentikan Simulasi' : '⚡ Simulasikan Hujan Lebat'}
                      </button>
                    </div>

                    {isHeavyRainSimulated && (
                      <div className="bg-white p-4 rounded-xl border border-[#c1c7cf]/40 space-y-3 animate-fade-in text-xs">
                        <div>
                          <label className="flex justify-between text-[11px] font-bold text-[#41474e] mb-1">
                            <span>Intensitas Curah Hujan Lokal:</span>
                            <span className="text-[#ba1a1a] font-bold">{simulatedRainIntensity} mm/jam (Ekstrem)</span>
                          </label>
                          <input 
                            type="range" 
                            min="30" 
                            max="120" 
                            value={simulatedRainIntensity}
                            onChange={(e) => setSimulatedRainIntensity(Number(e.target.value))}
                            className="w-full accent-[#ba1a1a] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <p className="text-[10px] text-[#41474e] leading-relaxed">
                          <strong>Dampak Simulasi:</strong> Air mengalir dari Lereng Merapi membawa muatan sedimen pasir ke stasiun Mrican, disusul stasiun Papringan, kemudian menggenang di wilayah dataran rendah Kotagede.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* SECTION: ALERT REGISTRATION FORM (WhatsApp alert warning) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                
                {/* Form Registration */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#c1c7cf]/40 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#003b5a] flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                      <Bell className="w-4.5 h-4.5 text-[#006d37] animate-swing" />
                      Daftar Peringatan Banjir WA
                    </h4>
                    <p className="text-xs text-[#41474e] mb-4 leading-relaxed">
                      Dapatkan sms/pesan notifikasi peringatan dini otomatis di handphone Anda saat TMA meningkat melampaui level Waspada.
                    </p>

                    <form onSubmit={handleSubscribe} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#41474e] mb-1">Nama Lengkap:</label>
                        <input 
                          type="text" 
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Contoh: Joko Supriyadi"
                          className="w-full text-xs bg-slate-50 border border-[#c1c7cf] rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-[#003b5a] text-[#091d2e]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#41474e] mb-1">No. WhatsApp / HP Aktif:</label>
                        <input 
                          type="tel" 
                          required
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full text-xs bg-slate-50 border border-[#c1c7cf] rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-[#003b5a] text-[#091d2e]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#41474e] mb-1">Stasiun Terdekat Hunian:</label>
                        <select 
                          value={stationInput}
                          onChange={(e) => setStationInput(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-[#c1c7cf] rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-[#003b5a] text-[#091d2e]"
                        >
                          <option value="mrican">Mrican (Hulu) - Sleman Utara</option>
                          <option value="papringan">Papringan (Tengah) - Depok Sleman</option>
                          <option value="kotagede">Kotagede (Hilir) - Kota Yogyakarta</option>
                        </select>
                      </div>

                      <button 
                        id="btn-submit-subscribe"
                        type="submit" 
                        className="w-full bg-[#003b5a] hover:bg-[#1a5276] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Daftar Notifikasi
                      </button>
                    </form>

                    {showSubSuccess && (
                      <div className="mt-3 p-3 bg-[#6bfe9c]/20 border border-[#6bfe9c] text-[#00743a] text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Pendaftaran Berhasil! Nomor Anda telah terdaftar dalam database mitigasi lokal.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscribed numbers list (Simulated Database persistence in LocalStorage) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#c1c7cf]/40 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#003b5a] uppercase tracking-wide">
                          Penerima Notifikasi Terdaftar
                        </h4>
                        <p className="text-[10px] text-[#41474e]">Simulasi nomor terdaftar database lokal</p>
                      </div>
                      <span className="text-[10px] bg-[#6bfe9c]/20 text-[#00743a] px-2 py-0.5 rounded font-bold">
                        {subscribers.length} Terdaftar
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {subscribers.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/50 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#003b5a]">{sub.name}</p>
                            <p className="text-[10px] text-[#41474e] mt-0.5">
                              No: <span className="font-mono">{sub.phone}</span> &bull; Pantau: {sub.station}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-[#72787f] font-mono">{sub.timestamp}</span>
                            <button 
                              onClick={() => deleteSubscriber(sub.id)}
                              className="text-[10px] text-red-600 hover:underline font-semibold"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-[#41474e] leading-normal opacity-80 mt-4 pt-4 border-t border-slate-100">
                    *Nomor telepon disamarkan demi privasi pengguna harian. Seluruh database ini disimpan secara lokal di browser Anda (LocalStorage) untuk kepatuhan etika data.
                  </p>
                </div>

              </div>

            </div>

            {/* Dashboard Footer */}
            <div className="bg-[#edf4ff] px-6 py-4 border-t border-[#c1c7cf]/40 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[10px] text-[#41474e] font-medium">
                Pusat Data Mitigasi &copy; 2026 - Kerjasama SEGAR &amp; UGM Yogyakarta
              </span>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsHeavyRainSimulated(false)}
                  className="text-xs font-bold text-[#003b5a] hover:underline"
                >
                  Reset Simulasi Cuaca
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => setIsDashboardOpen(false)}
                  className="text-xs font-bold text-[#003b5a] hover:underline"
                >
                  Kembali ke Portal Utama
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
