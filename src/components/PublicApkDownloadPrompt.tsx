import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

function isPromptRoute() {
  const route = `${window.location.pathname}${window.location.hash}`.toLowerCase();
  return route === '/' || route.endsWith('#/') || route.includes('/reset-password');
}

export default function PublicApkDownloadPrompt() {
  const [visible, setVisible] = useState(false);
  const apkUrl = import.meta.env.VITE_ANDROID_APK_URL as string | undefined;

  useEffect(() => {
    const sync = () => setVisible(isPromptRoute());
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  if (!visible || !apkUrl) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-cyan-400/30 bg-slate-950/80 p-3 shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
          <Smartphone size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white">
            Download Android APK
          </div>
          <div className="text-xs text-slate-300">
            Android app ကို တိုက်ရိုက်ဒေါင်းလုဒ်လုပ်နိုင်ပါသည်
          </div>
        </div>

        <a
          href={apkUrl}
          download="britium-express.apk"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
        >
          <Download size={16} />
          APK
        </a>
      </div>
    </div>
  );
}
