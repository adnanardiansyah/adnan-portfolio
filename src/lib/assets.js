// Original assets supplied by Adnan; source files are kept unchanged.
export const assets = {
  profile: {
    src: '/images/profile/adnan-ardiansyah.webp',
    uploadPath: '/images/profile/adnan-ardiansyah.webp',
    isPlaceholder: false,
  },
  projects: Object.fromEntries(
    ['snapnext', 'triase-net', 'suara-digital-desa', 'siskamling'].map(id => [id, {
      src: `/images/projects/${id}/cover.webp`,
      uploadPath: `/images/projects/${id}/cover.webp`,
      isPlaceholder: false,
      imageFit: id === 'suara-digital-desa' ? 'contain' : 'cover',
      galleryLayout: id === 'suara-digital-desa' ? 'mobile' : 'desktop',
      gallery: id === 'suara-digital-desa'
        ? [1, 2, 3, 4, 5].map(index => `/images/projects/${id}/mobile-${index}.webp`)
        : [`/images/projects/${id}/cover.webp`],
    }]),
  ),
  resume: {
    src: '/resume/Adnan-Ardiansyah-CV.pdf',
    // Enable only after uploading the original CV. The link also checks the file.
    available: true,
  },
  openGraph: '/images/og/adnan-ardiansyah.png',
};
