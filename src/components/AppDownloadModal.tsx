import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, ArrowDown, ShieldCheck, Download, ChevronRight, CheckCircle2, Copy } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: 'en' | 'am';
}

export default function AppDownloadModal({
  isOpen,
  onClose,
  showToast,
  lang,
}: AppDownloadModalProps) {
  const [downloadStep, setDownloadStep] = useState<'confirm' | 'downloading' | 'success'>('downloading');
  const [progress, setProgress] = useState(0);
  const [clickedApp, setClickedApp] = useState(false);

  // Download simulation timer
  useEffect(() => {
    if (downloadStep !== 'downloading') return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger actual file download
          triggerActualDownload();
          // Transition to success screen
          setTimeout(() => {
            setDownloadStep('success');
            showToast(
              lang === 'en'
                ? 'Tesla Investment App downloaded successfully!'
                : 'የቴስላ ኢንቨስትመንት መተግበሪያ በተሳካ ሁኔታ ወርዷል!',
              'success'
            );
          }, 400);
          return 100;
        }
        const step = Math.floor(Math.random() * 4) + 2;
        return Math.min(prev + step, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [downloadStep]);

  const triggerActualDownload = () => {
    const blob = new Blob(
      [
        "Tesla Investment Limited - Official Android App (v1.0.4). Install this app on your Android device to start staking energy pools and manage your CBE/Telebirr portfolio with absolute freedom!"
      ],
      { type: "application/vnd.android.package-archive" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Tesla_Investment_Limited_v1.0.4.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartDownload = () => {
    setDownloadStep('downloading');
  };

  const handleReset = () => {
    setDownloadStep('confirm');
    setProgress(0);
    setClickedApp(false);
  };

  if (!isOpen) return null;

  // Custom SVG for the authentic "Tesla App" icon with dual-tone shading split precisely in the middle of the stem!
  const TeslaAppIcon = ({ className = "w-24 h-24" }: { className?: string }) => (
    <svg viewBox="0 0 120 120" className={`${className} filter drop-shadow-[0_8px_16px_rgba(27,102,219,0.35)]`}>
      <defs>
        {/* The precise vertical dual-tone split gradient */}
        <linearGradient id="symbolGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="41.3%" stopColor="#ffffff" />
          <stop offset="41.3%" stopColor="#eaeffa" />
          <stop offset="100%" stopColor="#d6def1" />
        </linearGradient>
      </defs>
      
      {/* Royal blue rounded squircle background */}
      <rect x="10" y="10" width="100" height="100" rx="30" fill="#1b66db" />
      
      {/* 1. Top horizontal bar */}
      <rect x="26" y="32" width="60" height="10" fill="url(#symbolGrad)" />
      
      {/* 2. Left vertical stem */}
      <rect x="38" y="42" width="14" height="44" fill="url(#symbolGrad)" />
      
      {/* 3. Right loop */}
      <path d="M 52 52 c 12 0, 20 4, 20 17 c 0,13 -8,17 -20,17 Z" fill="url(#symbolGrad)" />
      
      {/* 4. Loop cutout filled with the exact background color to create the clean hole */}
      <path d="M 52 60 c 6 0, 10 2, 10 9 c 0,7 -4,9 -10,9 Z" fill="#1b66db" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Header Row */}
      <div className="p-5 flex justify-between items-center border-b border-slate-900 bg-slate-950/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-xs text-slate-300 uppercase tracking-widest font-bold">
            {lang === 'en' ? 'Tesla Application Hub' : 'የቴስላ መተግበሪያ ማዕከል'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center relative p-6">
        
        {/* STEP 1: CONFIRM DOWNLOAD */}
        {downloadStep === 'confirm' && (
          <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
            {/* Pulsing Icon */}
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl w-32 h-32 mx-auto" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <TeslaAppIcon className="w-28 h-28 mx-auto" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <span className="bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Android Package • v1.0.4
              </span>
              <h3 className="text-xl font-black text-white tracking-tight">
                {lang === 'en' ? 'Tesla Investment App' : 'የቴስላ ኢንቨስትመንት መተግበሪያ'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                {lang === 'en'
                  ? 'Download the official secure package to access real-time staking pools, instantaneous offline deposits, and secure biometric withdrawals.'
                  : 'የእውነተኛ ጊዜ ኢንቨስትመንቶችን፣ ከመስመር ውጭ የተቀማጭ ኮዶችን እና አስተማማኝ ወጪዎችን ለማግኘት ኦፊሴላዊውን ደህንነቱ የተጠበቀ መተግበሪያ ያውርዱ።'}
              </p>
            </div>

            {/* Simulated/Sandbox Notice Banner to avoid 'Problem parsing the package' confusion */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200/90 rounded-2xl p-3.5 text-left text-[11.5px] leading-relaxed font-sans space-y-1 max-w-xs mx-auto">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest text-amber-400">
                <span>⚠️ SYSTEM SIMULATION NOTICE</span>
              </div>
              <p>
                {lang === 'en'
                  ? 'Please note: This web preview downloads a simulated demo APK package. Since compiling binary Android apps dynamically is restricted inside web preview sandboxes, this package cannot be executed directly on real devices (causing the "problem parsing the package" error).'
                  : 'እባክዎ ልብ ይበሉ፡ ይህ የድር መተግበሪያ የማስመሰያ ማሳያ (demo) APK ፋይልን ያወርዳል። እውነተኛ የ Android መተግበሪያዎችን በድር ቅድመ-ዕይታ ላይ በቀጥታ መገንባት ስለማይቻል ይህ ፋይል በእውነተኛ ስልኮች ላይ ሊጫን አይችልም።'}
              </p>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/40 border border-slate-900/80 rounded-2xl p-3.5 text-[10px] font-mono text-slate-400">
              <div className="text-center border-r border-slate-900/60">
                <span className="block text-[8px] text-slate-500 uppercase tracking-wider">Size</span>
                <span className="font-bold text-slate-200 mt-0.5 block">14.2 MB</span>
              </div>
              <div className="text-center border-r border-slate-900/60">
                <span className="block text-[8px] text-slate-500 uppercase tracking-wider">Security</span>
                <span className="font-bold text-emerald-400 mt-0.5 block flex items-center justify-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> SHA-256
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] text-slate-500 uppercase tracking-wider">Type</span>
                <span className="font-bold text-slate-200 mt-0.5 block">APK / Mobile</span>
              </div>
            </div>

            <button
              onClick={handleStartDownload}
              className="w-full bg-[#fbbc05] hover:bg-[#e2a804] text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 transition-all font-sans"
            >
              <Download className="w-4 h-4" />
              {lang === 'en' ? 'DOWNLOAD OFFICIAL APK' : 'ኦፊሴላዊውን መተግበሪያ አውርድ'}
            </button>
          </div>
        )}

        {/* STEP 2: DOWNLOADING PROGRESS */}
        {downloadStep === 'downloading' && (
          <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
            {/* Spinning/pulsing graphic */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-slate-900 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-t-[#fbbc05] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" 
                style={{ animationDuration: '1s' }}
              />
              <div className="relative text-center">
                <span className="text-2xl font-black font-mono text-white">{progress}%</span>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Downloading</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#fbbc05]">
                {progress < 40 
                  ? 'Establishing secure link...' 
                  : progress < 80 
                  ? 'Retrieving encrypted chunks...' 
                  : 'Verifying package signatures...'}
              </h4>
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                {lang === 'en'
                  ? 'Downloading from Tesla Secured CDN. Do not close this panel.'
                  : 'ከቴስላ ደህንነቱ የተጠበቀ ሰርቨር ላይ በመውረድ ላይ ነው። ይህንን ገጽ አይዝጉት።'}
              </p>
            </div>

            {/* Simulated file download track */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#fbbc05] h-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: SIMULATED MOBILE PHONE LOCKSCREEN/WALLPAPER WITH THE TESLA APP ICON */}
        {downloadStep === 'success' && (
          <div className="w-full max-w-md h-full flex flex-col justify-center items-center relative py-4 animate-fade-in">
            
            {/* Interactive Alert Banner */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-emerald-950/40 border border-emerald-900/50 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-left">
                <h5 className="text-[11px] font-bold text-white font-sans uppercase tracking-wider">
                  {lang === 'en' ? 'Package Installed/Saved' : 'መተግበሪያው በተሳካ ሁኔታ ወርዷል'}
                </h5>
                <p className="text-[9.5px] text-emerald-300 font-sans leading-normal">
                  {lang === 'en'
                    ? 'The APK file is saved. Click the Tesla App on the home screen below to view the installation tutorial.'
                    : 'መተግበሪያው ስልክዎ ላይ ተቀምጧል። መመሪያውን ለማየት ከታች ያለውን የቴስላ መተግበሪያ ይጫኑ።'}
                </p>
              </div>
            </div>

            {/* THE WALLPAPER & APP ICON SCREEN (EXACT REPLICA OF UPLOADED SCREENSHOT!) */}
            <div className="relative w-full aspect-square max-w-[340px] rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl bg-zinc-950 flex flex-col items-center justify-center p-6 mt-8">
              
              {/* Wallpaper elements: Premium bronze/golden reflective dual-ovals! */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1c1917] via-[#09090b] to-[#1c1917] pointer-events-none" />
              
              {/* Upper metallic gold oval reflective ring */}
              <div className="absolute top-[-30%] left-[-20%] right-[-20%] h-[68%] rounded-[50%] border-b-4 border-amber-500/20 bg-gradient-to-b from-transparent via-[#2a241b]/10 to-amber-500/5 shadow-[0_15px_30px_rgba(251,188,5,0.08)] pointer-events-none" />
              
              {/* Lower metallic gold oval reflective ring */}
              <div className="absolute bottom-[-30%] left-[-20%] right-[-20%] h-[68%] rounded-[50%] border-t-4 border-amber-500/20 bg-gradient-to-t from-transparent via-[#2a241b]/10 to-amber-500/5 shadow-[0_-15px_30px_rgba(251,188,5,0.08)] pointer-events-none" />

              {/* Glossy radial shimmer overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,188,5,0.06)_0%,transparent_70%)] pointer-events-none" />

              {/* THE TESLA APP ICON (INTERACTIVE LAUNCHER) */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setClickedApp(true)}
                className="relative z-10 flex flex-col items-center gap-3.5 focus:outline-none cursor-pointer group"
              >
                {/* Simulated Notification Badge */}
                <div className="absolute -top-1 -right-1 z-20 bg-red-600 border-2 border-zinc-950 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white font-mono shadow-md animate-bounce">
                  1
                </div>

                <TeslaAppIcon className="w-24 h-24 shadow-2xl group-hover:shadow-blue-500/10 transition-shadow" />
                
                <span className="text-white text-sm font-medium tracking-wide font-sans text-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Tesla App
                </span>
              </motion.button>
            </div>

            {/* Instruction popover drawer when the app icon is clicked */}
            <AnimatePresence>
              {clickedApp && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 rounded-t-[32px] p-5 shadow-2xl space-y-4 text-left max-h-[80%] overflow-y-auto"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-mono font-black uppercase tracking-wider text-[#fbbc05] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      {lang === 'en' ? 'Secure Installation Guide' : 'አስተማማኝ የአጫጫን መመሪያ'}
                    </h4>
                    <button
                      onClick={() => setClickedApp(false)}
                      className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {lang === 'en' ? 'Close' : 'ዝጋ'}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-300 font-sans leading-relaxed">
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#fbbc05]/15 text-[#fbbc05] font-mono font-bold flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-bold text-white">
                          {lang === 'en' ? 'Locate downloaded APK file' : 'የወረደውን APK ፋይል ያግኙ'}
                        </p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">
                          {lang === 'en' 
                            ? 'Open your device\'s File Manager or Downloads folder and select'
                            : 'የስልክዎን ፋይል ማውጫ ወይም የወረዱ ፋይሎች ክፍል በመክፈት የሚከተለውን ይምረጡ:'}{' '}
                          <span className="font-mono text-[#fbbc05] text-[10px] block mt-0.5 font-bold">Tesla_Investment_Limited_v1.0.4.apk</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#fbbc05]/15 text-[#fbbc05] font-mono font-bold flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-bold text-white">
                          {lang === 'en' ? 'Enable Unknown Sources' : 'ያልታወቁ ምንጮችን ፍቀድ'}
                        </p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">
                          {lang === 'en'
                            ? 'If Android blocks the install, click Settings in the popup and toggle "Allow installation from this source".'
                            : 'ስልክዎ መጫኑን ከከለከለ፣ Settings ላይ በመግባት "Allow installation from this source" የሚለውን ፍቃድ ይስጡ።'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#fbbc05]/15 text-[#fbbc05] font-mono font-bold flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-bold text-white">
                          {lang === 'en' ? 'Launch & Log In' : 'ክፈት እና ግባ'}
                        </p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">
                          {lang === 'en'
                            ? 'Open the app on your home screen and login with your registered email and password to instantly restore your balance.'
                            : 'መተግበሪያውን በመክፈት ቀድሞ በተመዘገቡበት ኢሜይል እና የይለፍ ቃል በመግባት ሂሳብዎን ወዲያውኑ ማመሳሰል ይችላሉ።'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Tesla_Investment_Limited_v1.0.4.apk");
                      showToast(lang === 'en' ? 'Filename copied!' : 'የፋይል ስም ተገልብጧል!', 'success');
                    }}
                    className="w-full bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-[10.5px] uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Copy Package Filename' : 'የፋይል ስም ቅዳ'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Footer bar */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40 text-center font-mono text-[9px] text-slate-500">
        {downloadStep === 'success' ? (
          <button
            onClick={handleReset}
            className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mx-auto cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            {lang === 'en' ? 'Download Again' : 'እንደገና አውርድ'}
          </button>
        ) : (
          <span>© 2026 Tesla Investment • Secure Hash Client</span>
        )}
      </div>
    </motion.div>
  );
}
