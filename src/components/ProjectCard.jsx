'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { assets } from '@/lib/assets';

export default function ProjectCard({ project, index = 0 }) {
  const [failed, setFailed] = useState(false);
  const id = project.id;
  const knownAsset = assets.projects[id];
  const source = project.image || project.image_url;
  const placeholder = failed || !source || project.imageIsPlaceholder || source.endsWith('/placeholder.svg') || source.includes('/placeholders/');
  const title = project.title || project.text;

  return (
    <article className="project-card group min-w-0 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c0b13]/90 transition-colors duration-500 hover:border-[#a78bfa]/50 focus-within:border-[#60a5fa]/70">
      <Link href={`/project/${id}`} className="relative block aspect-[16/10] overflow-hidden border-b border-white/10" aria-label={`View ${title} details`}>
        {!failed && source ? <Image src={source} alt={placeholder ? `${title} — screenshot placeholder` : `${title} project preview`} fill unoptimized sizes="(max-width: 639px) 100vw, 50vw" className={`${project.imageFit === 'contain' ? 'object-contain bg-[#101322]' : 'object-cover object-top'} transition-transform duration-700 group-hover:scale-[1.02]`} onError={() => setFailed(true)} /> : <span className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Preview unavailable</span>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b13]/50 to-transparent pointer-events-none" />
        <span className="absolute top-4 left-4 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-[10px] text-white/65 backdrop-blur-md">{String(index + 1).padStart(2, '0')}</span>
        {placeholder && <span className="absolute bottom-4 left-4 right-4 text-[9px] tracking-[0.18em] uppercase text-white/70">Screenshot placeholder</span>}
      </Link>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="text-[9px] uppercase tracking-[0.22em] text-[#a78bfa] mb-3">{project.categoryLabel || (id === 'siskamling' ? 'App · KMIPN 2026' : project.category)}</p>
        <h3 className="text-2xl font-bold tracking-tight leading-tight text-white break-words"><Link href={`/project/${id}`}>{title}</Link></h3>
        <p className="mt-4 mb-7 text-sm leading-relaxed text-white/55">{project.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-4 border-t border-white/10 pt-5">
          <Link href={`/project/${id}`} className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white hover:text-[#a78bfa] transition-colors" aria-label={`View ${title} project details`}>View details <span aria-hidden="true">↗</span></Link>
          {project.link ? <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#60a5fa] hover:text-white transition-colors" aria-label={`${project.linkLabel || 'Open website'}: ${title}`}>{project.linkLabel || 'Visit website'} <span aria-hidden="true">↗</span></a> : <span className="text-[10px] text-white/35">Public demo pending</span>}
        </div>
        {knownAsset && <span className="sr-only">{placeholder ? 'A project screenshot has not been supplied.' : 'Project image supplied.'}</span>}
      </div>
    </article>
  );
}
