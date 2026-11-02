"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackClick } from "@/lib/trackClick";
import { profile } from "@/lib/profile";

const PROFILE_SOCIALS = [{label:"GitHub",href:profile.github},{label:"LinkedIn",href:profile.linkedin}];

const LINKS = [
  { label: "About",   href: "/about"   },
  { label: "Contact", href: "/contact" },
];

const SOCIAL_KEYS = [
  { key: "instagram", label: "Instagram" },
  { key: "github",    label: "GitHub"    },
  { key: "linkedin",  label: "LinkedIn"  },
  { key: "twitter",   label: "X"         },
  { key: "youtube",   label: "YouTube"   },
  { key: "behance",   label: "Behance"   },
  { key: "dribbble",  label: "Dribbble"  },
  { key: "whatsapp",  label: "WhatsApp"  },
];

export default function Footer() {
  const ref = useRef(null);
  const [socials, setSocials] = useState(PROFILE_SOCIALS);

  useEffect(() => {
    fetch("/api/settings?key=social_links")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.value) return;
        const active = SOCIAL_KEYS.filter(s => data.value[s.key]?.trim()).map(s => ({
          label: s.label,
          href:  data.value[s.key].trim(),
        }));
        setSocials([...PROFILE_SOCIALS, ...active.filter(s => s.label !== 'GitHub' && s.label !== 'LinkedIn')]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(48px)";
    el.style.transition = "opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={ref} className="relative border-t border-white/8 px-10 md:px-20 py-16">

      {/* top row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">

        {/* name + tagline */}
        <div>
          <p className="text-[10px] text-[#a78bfa] tracking-[0.5em] uppercase mb-4 font-medium">
            Code · Intelligence · Connection
          </p>
          <h2
            className="font-black tracking-tighter leading-[0.85]"
            style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}
          >
            <span className="block text-white">Adnan Ardiansyah</span>
          </h2>
        </div>

        {/* nav + socials */}
        <div className="flex flex-col gap-8 md:items-end">
          <nav className="flex gap-8 text-[11px] uppercase tracking-[0.3em] font-medium">
            {LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-white/40 hover:text-[#a78bfa] transition-colors duration-300"
              >
                {label}
              </Link>
            ))}
          </nav>

          {socials.length > 0 && (
            <div className="flex flex-wrap gap-8 text-[11px] uppercase tracking-[0.3em] font-medium">
              {socials.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(`social-${label.toLowerCase()}`, href)}
                  className="text-white/25 hover:text-white/70 transition-colors duration-300"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* divider */}
      <div className="w-full h-px bg-white/8 mb-8" />

      {/* bottom row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p
          className="text-[10px] text-white/20 tracking-widest"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontStyle: "italic" }}
        >
          Politeknik Negeri Lhokseumawe
        </p>
        <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase">
          © {new Date().getFullYear()} Adnan Ardiansyah. All rights reserved.
        </p>
      </div>

    </footer>
  );
}
