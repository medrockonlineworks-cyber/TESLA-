import { Home, Zap, Wallet, User, ShieldAlert } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'invest' | 'wallet' | 'profile';
  setActiveTab: (tab: 'home' | 'invest' | 'wallet' | 'profile') => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  lang: 'en' | 'am';
}

export default function BottomNav({ activeTab, setActiveTab, isAdmin, onOpenAdmin, lang }: BottomNavProps) {
  const labels = {
    en: { home: 'Home', invest: 'Invest', wallet: 'Wallet', profile: 'Profile' },
    am: { home: 'ቤት', invest: 'ኢንቨስት', wallet: 'ዋሌት', profile: 'ፕሮፋይል' },
  };

  const tabs = [
    { id: 'home' as const, label: labels[lang].home, icon: Home },
    { id: 'invest' as const, label: labels[lang].invest, icon: Zap },
    { id: 'wallet' as const, label: labels[lang].wallet, icon: Wallet },
    { id: 'profile' as const, label: labels[lang].profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-100 backdrop-blur-md pb-safe-bottom">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 h-full relative cursor-pointer group transition-all"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-600 scale-110 bg-amber-50'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-semibold font-sans mt-0.5 tracking-wider transition-colors ${
                  isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {tab.label}
              </span>

              {/* Glowing active yellow dot */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#fbbc05] rounded-full shadow-sm" />
              )}
            </button>
          );
        })}

        {/* Float Admin Quick Trigger if admin */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="absolute -top-12 right-6 p-2.5 bg-[#fbbc05] text-slate-950 rounded-full shadow-lg hover:bg-[#e2a804] active:scale-95 transition-all cursor-pointer border border-slate-200 z-50 flex items-center justify-center animate-bounce"
            title="Open Admin Panel"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
}
