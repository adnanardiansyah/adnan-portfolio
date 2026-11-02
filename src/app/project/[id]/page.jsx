"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import PageShell from "../../../components/PageShell";
import { isRetiredProject } from '@/lib/profile';

function safeUrl(url) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function ProjectPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isRetiredProject({id})) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/works/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data && !data.error && !isRetiredProject(data)) {
          setProject(data);
          setLoading(false);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!project) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    gsap.from(".proj-hero-text", { y: 50, opacity: 0, duration: 0.8, ease: "power4.out", delay: 0.2 });
    gsap.from(".proj-body",  { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.4 });
  }, [project]);

  // Parse tech/services into array safely
  const servicesData = project?.services || project?.tech;
  let services = [];
  if (Array.isArray(servicesData)) {
    services = servicesData;
  } else if (typeof servicesData === "string") {
    services = servicesData.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  // Parse gallery safely
  let gallery = [];
  if (project?.gallery) {
    if (Array.isArray(project.gallery)) {
      gallery = project.gallery;
    } else if (typeof project.gallery === "string") {
      try {
        gallery = JSON.parse(project.gallery);
      } catch (e) {
        console.error("Failed to parse gallery:", e);
      }
    }
  }

  return (
    <PageShell>
      <div className="min-h-screen bg-[#080808] text-white">

        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-6 h-6 border-2 border-white/20 border-t-[#a78bfa] rounded-full animate-spin" />
          </div>
        )}

        {notFound && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <p className="text-white/20 text-sm tracking-widest uppercase">Project not found</p>
            <Link href="/projects" className="text-[#a78bfa] text-[11px] tracking-[0.4em] uppercase hover:opacity-70 transition-opacity">
              Back to projects
            </Link>
          </div>
        )}

        {project && (
          <>
            {/* ── HERO ── */}
            <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
              {project.image_url || project.mobile_image_url ? (
                (project.image_url?.includes('.mp4') || project.image_url?.includes('.webm') || project.image_url?.includes('.mov')) ? (
                  <video src={project.image_url} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
                ) : (
                  <picture>
                    {project.mobile_image_url && <source media="(max-width: 767px)" srcSet={project.mobile_image_url} />}
                    <img
                      src={project.image_url || project.mobile_image_url}
                      alt={project.title}
                      onError={event => { event.currentTarget.style.display = 'none'; }}
                      className={`absolute inset-0 w-full h-full bg-[#0b0c14] ${project.imageFit === 'contain' ? 'object-contain' : 'object-cover object-top'}`}
                    />
                  </picture>
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#080808]" />
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

              {/* Hero text */}
              <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-10 md:pb-14">
                <div className="proj-hero-text">
                  {project.category && (
                    <span className="inline-block text-[10px] text-[#a78bfa] tracking-[0.5em] uppercase font-medium mb-3 border border-[#a78bfa]/30 px-3 py-1 rounded-full">
                      {project.categoryLabel || project.category}
                    </span>
                  )}
                  <h1
                    className="font-black tracking-tighter leading-[0.88] text-white"
                    style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)" }}
                  >
                    {project.title}
                  </h1>
                  {(project.client || project.year) && (
                    <div className="flex items-center gap-6 mt-4 text-white/50 text-sm">
                      {project.client && (
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 12c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          {project.client}
                        </span>
                      )}
                      {project.year && (
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 5.5h11M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          {project.year}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="proj-body px-6 md:px-16 py-16 md:py-20 max-w-7xl mx-auto">
              <div className="grid md:grid-cols-[1fr_280px] gap-12 md:gap-20">

                {/* LEFT — description + gallery */}
                <div>
                  {project.description && (
                    <>
                      <h2 className="font-black text-xl text-white mb-5 tracking-tight">Project overview</h2>
                      <p className="text-white/55 text-base md:text-lg font-light leading-relaxed mb-12">
                        {project.description}
                      </p>
                      {(project.imageIsPlaceholder || project.image_url?.endsWith('/placeholder.svg')) && <p className="text-[10px] uppercase tracking-widest text-[#a78bfa]/70 mb-10">Preview image placeholder · screenshot pending</p>}
                    </>
                  )}

                  {project.review && (
                    <blockquote className="border-l-2 border-[#a78bfa]/40 pl-6 mb-12">
                      <p className="text-white/50 italic text-base leading-relaxed font-serif">&quot;{project.review}&quot;</p>
                    </blockquote>
                  )}
                  {/* Responsive Previews */}
                  {(project.desktop_view_url || project.phone_view_url) && (
                    <div className="mb-12">
                      <h2 className="font-black text-xl text-white mb-6 tracking-tight">Previews</h2>
                      <div className="flex flex-col gap-6">
                        {project.desktop_view_url && (
                          <div className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                            <img src={project.desktop_view_url} alt="Desktop Preview" className="w-full object-cover" />
                          </div>
                        )}
                        {project.phone_view_url && (
                          <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                            <img src={project.phone_view_url} alt="Phone Preview" className="w-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gallery */}
                  {gallery && gallery.length > 0 && (
                    <div>
                      <h2 className="font-black text-xl text-white mb-3 tracking-tight">{project.galleryLayout === 'mobile' ? 'Mobile screenshots' : 'Project screenshots'}</h2>
                      <p className="text-white/45 text-sm mb-6">Open a screenshot to view the original image.</p>
                      <div data-project-gallery className={project.galleryLayout === 'mobile' ? 'grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-4 items-start' : 'grid grid-cols-1 gap-5'}>
                        {gallery.map((url, i) => (
                          <figure key={i} className="min-w-0 rounded-2xl overflow-hidden bg-[#10111b] border border-white/10">
                            {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                muted loop playsInline autoPlay
                              />
                            ) : (
                              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.title} screenshot ${i + 1}`}><img
                                src={url}
                                alt={`${project.title} ${project.galleryLayout === 'mobile' ? 'mobile ' : ''}screenshot ${i + 1}`}
                                loading="lazy"
                                className="block w-full h-auto cursor-zoom-in"
                              /></a>
                            )}
                            <figcaption className="px-4 py-3 text-[9px] uppercase tracking-[0.18em] text-white/50">{project.galleryLayout === 'mobile' ? 'Mobile' : 'Website'} · {String(i + 1).padStart(2,'0')}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT — project details sidebar */}
                <div className="md:pt-1">
                  <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:sticky md:top-28 flex flex-col gap-6">
                    <h3 className="font-bold text-white text-base tracking-tight">Project Details</h3>

                    {project.client && (
                      <div>
                        <p className="text-[9px] text-white/30 tracking-[0.4em] uppercase mb-1.5">Client</p>
                        <p className="text-white text-sm font-medium">{project.client}</p>
                      </div>
                    )}

                    {project.year && (
                      <div>
                        <p className="text-[9px] text-white/30 tracking-[0.4em] uppercase mb-1.5">Year</p>
                        <p className="text-white text-sm font-medium">{project.year}</p>
                      </div>
                    )}

                    {project.category && (
                      <div>
                        <p className="text-[9px] text-white/30 tracking-[0.4em] uppercase mb-1.5">Category</p>
                        <p className="text-white/70 text-sm">{project.categoryLabel || project.category}</p>
                      </div>
                    )}

                    {services.length > 0 && (
                      <div>
                        <p className="text-[9px] text-white/30 tracking-[0.4em] uppercase mb-2">Services</p>
                        <ul className="flex flex-col gap-1.5">
                          {services.map((s) => (
                            <li key={s} className="flex items-center gap-2 text-white/60 text-sm">
                              <span className="w-1 h-1 rounded-full bg-[#a78bfa] shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {project.link && (
                      <a
                        href={safeUrl(project.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 w-full flex items-center justify-center gap-2 bg-[#a78bfa] text-black font-bold py-3 rounded-xl text-[11px] uppercase tracking-widest hover:bg-[#60a5fa] transition-colors duration-300"
                      >
                        {project.linkLabel || 'Visit website'}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 8L8 2M8 2H4M8 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      </a>
                    )}
                    {!project.link && <p className="text-white/45 text-xs leading-relaxed">A public demo has not been shared yet.</p>}
                  </div>
                </div>

              </div>
            </div>

            {/* ── CTA ── */}
            <div className="border-t border-white/5 py-24 px-6 md:px-16 text-center">
              <p className="text-[10px] text-[#a78bfa] tracking-[0.5em] uppercase mb-5 font-medium">Code · Intelligence · Connection</p>
              <h2 className="font-black tracking-tighter leading-[0.9] mb-8 text-white" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                Have an idea<br />
                <span className="ghost-orange italic font-serif">to explore?</span>
              </h2>
              <p className="text-white/30 text-sm font-light mb-10 max-w-md mx-auto leading-relaxed">
                Let&apos;s talk about web development, intelligent systems, and the infrastructure that connects them.
              </p>
              <Link
                href="/#contact-section"
                className="inline-flex items-center gap-3 bg-[#a78bfa] text-black font-black px-8 py-4 rounded-full text-[11px] uppercase tracking-[0.25em] hover:bg-[#60a5fa] transition-colors duration-300"
              >
                Get In Touch
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </Link>
            </div>
          </>
        )}

      </div>
    </PageShell>
  );
}
