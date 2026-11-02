'use client';

import { useEffect, useState } from 'react';
import { assets } from '@/lib/assets';

export default function ResumeLink() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!assets.resume.available) return;
    const controller = new AbortController();
    fetch(assets.resume.src, { method: 'HEAD', signal: controller.signal })
      .then(response => setAvailable(response.ok && response.headers.get('content-type')?.includes('application/pdf')))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!available) return null;
  return (
    <a href={assets.resume.src} download="Adnan-Ardiansyah-CV.pdf" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white/75 text-[10px] uppercase tracking-widest hover:border-[#60a5fa] hover:text-white transition-colors">
      Download CV <span aria-hidden="true">↓</span>
    </a>
  );
}
