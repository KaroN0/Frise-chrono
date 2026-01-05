
import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  LayoutList, 
  LayoutGrid, 
  Loader2,
  X,
  Copy,
  Check,
  Link as LinkIcon,
  Menu
} from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { LayoutMode, TimelineEvent, AppSettings } from './types';
import Sidebar from './components/Sidebar';
import VerticalTimeline from './components/VerticalTimeline';
import HorizontalTimeline from './components/HorizontalTimeline';
import EventModal from './components/EventModal';
import DescriptionModal from './components/DescriptionModal';

const INITIAL_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    year: '1789',
    title: 'Révolution Française',
    imageUrl: 'https://picsum.photos/id/10/400/300',
    description: "La Révolution française est une période de bouleversements sociaux et politiques de grande envergure dans l'histoire de France, qui a débuté avec l'ouverture des États généraux en 1789."
  },
  {
    id: '2',
    year: '1945',
    title: 'Fin de la 2nde Guerre Mondiale',
    imageUrl: 'https://picsum.photos/id/11/400/300',
    description: "La fin de la Seconde Guerre mondiale est marquée par la capitulation sans condition du Troisième Reich le 8 mai 1945."
  }
];

const App: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_EVENTS);
  const [settings, setSettings] = useState<AppSettings>({
    title: 'Ma Frise Historique',
    layout: 'vertical',
    bgColor: '#fdfbf7', // Teinte papier crème/sépia très clair
    bgImageUrl: '',
    lineColor: '#c2410c' // Orange sépia (orange-700)
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<TimelineEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#state=')) {
      try {
        const base64 = hash.replace('#state=', '');
        const json = decodeURIComponent(escape(atob(base64)));
        const data = JSON.parse(json);
        if (data.events) setEvents(data.events);
        if (data.settings) setSettings(data.settings);
      } catch (e) {
        console.error("Erreur lors de la lecture du lien de partage", e);
      }
    }
  }, []);

  const addEvent = (event: TimelineEvent) => {
    const newEvents = [...events, event].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    setEvents(newEvents);
    setIsAddingEvent(false);
  };

  const updateEvent = (updatedEvent: TimelineEvent) => {
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    setEvents(newEvents);
    setEditingEvent(null);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleExport = async (format: 'png' | 'pdf' | 'jpeg') => {
    if (!timelineRef.current) return;
    setIsExporting(true);
    timelineRef.current.classList.add('export-mode');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const options = {
        quality: 0.95,
        cacheBust: true,
        backgroundColor: settings.bgColor,
        width: timelineRef.current.scrollWidth,
        height: timelineRef.current.scrollHeight,
        pixelRatio: 1,
        style: {
          padding: '60px',
          margin: '0',
          transform: 'none',
          display: 'block',
          width: `${timelineRef.current.scrollWidth}px`,
          height: `${timelineRef.current.scrollHeight}px`,
        }
      };

      let dataUrl: string;
      if (format === 'png') {
        dataUrl = await toPng(timelineRef.current, options);
      } else {
        dataUrl = await toJpeg(timelineRef.current, options);
      }

      if (format === 'pdf') {
        const width = timelineRef.current.scrollWidth;
        const height = timelineRef.current.scrollHeight;
        const orientation = width > height ? 'l' : 'p';
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'px',
          format: [width + 120, height + 120]
        });
        pdf.addImage(dataUrl, 'JPEG', 60, 60, width, height);
        pdf.save(`${settings.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${settings.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format}`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Erreur exportation:', err);
      alert("L'exportation a échoué.");
    } finally {
      timelineRef.current?.classList.remove('export-mode');
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    const stateJson = JSON.stringify({ events, settings });
    const base64 = btoa(unescape(encodeURIComponent(stateJson)));
    const url = `${window.location.origin}${window.location.pathname}#state=${base64}`;
    setShareUrl(url);
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col transition-all duration-500 overflow-x-hidden"
      style={{ 
        backgroundColor: settings.bgColor,
        backgroundImage: settings.bgImageUrl ? `url(${settings.bgImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-stone-900/80 backdrop-blur-md flex items-center justify-center text-white">
          <div className="bg-white/10 p-10 rounded-3xl flex flex-col items-center gap-6 border border-white/20 shadow-2xl">
            <Loader2 className="w-14 h-14 animate-spin text-orange-400" />
            <div className="text-center">
              <p className="font-bold text-2xl tracking-tight">Finalisation de la frise...</p>
              <p className="text-orange-200 mt-2">Veuillez patienter pendant la capture.</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* LOGO AREA */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-historical text-2xl font-black tracking-tighter text-stone-800">
              Chrono<span className="text-orange-600">Gen</span>
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 -mt-1">
            créateur de frises historiques
          </span>
        </div>

        {/* DYNAMIC TITLE (SEPIA ORANGE) */}
        <div className="flex-1 flex justify-center min-w-[200px]">
          <h1 className="font-historical text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent truncate max-w-lg px-4 text-center">
            {settings.title}
          </h1>
        </div>

        {/* TOOLS AREA */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="hidden lg:flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button 
              onClick={() => setSettings({ ...settings, layout: 'horizontal' })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.layout === 'horizontal' ? 'bg-white shadow-sm text-orange-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>HORIZONTAL</span>
            </button>
            <button 
              onClick={() => setSettings({ ...settings, layout: 'vertical' })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.layout === 'vertical' ? 'bg-white shadow-sm text-orange-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>VERTICAL</span>
            </button>
          </div>
          
          <button 
            onClick={() => setIsAddingEvent(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline uppercase text-xs tracking-wider">Événement</span>
          </button>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all border border-stone-200 flex items-center gap-2 group"
            title="Paramètres de la frise"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            <span className="hidden xl:inline text-xs font-bold uppercase">Réglages</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div 
          ref={timelineRef} 
          className="p-8 md:p-12 min-h-full transition-all"
          style={{ 
            backgroundColor: settings.bgColor,
            backgroundImage: settings.bgImageUrl ? `url(${settings.bgImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {settings.layout === 'vertical' ? (
            <VerticalTimeline 
              events={events} 
              lineColor={settings.lineColor}
              onViewDetails={setViewingEvent}
              onEdit={setEditingEvent}
              onDelete={deleteEvent}
            />
          ) : (
            <HorizontalTimeline 
              events={events} 
              lineColor={settings.lineColor}
              onViewDetails={setViewingEvent}
              onEdit={setEditingEvent}
              onDelete={deleteEvent}
            />
          )}
        </div>
      </main>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExport}
        onShare={handleShare}
      />

      {(isAddingEvent || editingEvent) && (
        <EventModal 
          event={editingEvent}
          onClose={() => {
            setIsAddingEvent(false);
            setEditingEvent(null);
          }}
          onSave={(evt) => editingEvent ? updateEvent(evt) : addEvent(evt)}
        />
      )}

      {viewingEvent && (
        <DescriptionModal 
          event={viewingEvent} 
          onClose={() => setViewingEvent(null)}
          onUpdate={updateEvent}
        />
      )}

      {shareUrl && (
        <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />
      )}
    </div>
  );
};

const ShareModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-zoom-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-orange-600" />
            Partager ma frise
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="relative flex items-center">
          <input readOnly value={url} className="w-full pr-12 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-500 outline-none"/>
          <button onClick={handleCopy} className={`absolute right-2 p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors">Fermer</button>
      </div>
    </div>
  );
};

export default App;
