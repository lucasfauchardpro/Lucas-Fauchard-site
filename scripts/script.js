// ============================================
// ASSET BASE — préfixe pour résoudre les paths d'assets
// depuis n'importe quelle page (root index.html ou pages/X.html)
// Chaque HTML doit définir window.ASSET_BASE :
//   - index.html (racine)  → ''  (ou rien défini → défaut)
//   - pages/X.html (sous-dossier) → '../'
// ============================================
var A = (typeof window !== 'undefined' && window.ASSET_BASE) ? window.ASSET_BASE : '';

// ---- Theme toggle (light / dark) ----
function toggleTheme() {
  var html = document.documentElement;
  var current = html.getAttribute('data-theme') || 'light';
  var next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
}
// Initialiser depuis localStorage au cas où le script inline n'a pas marché
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();

// ---- Scroll animations (fade-in) ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.06 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ---- Animation des compteurs stats au scroll (touche Apple) ----
function animateCounter(el) {
  var raw = (el.textContent || '').trim();
  // Détecte si c'est un nombre simple (sinon on laisse tel quel)
  var match = raw.match(/^(\d+)$/);
  if (!match) { el.classList.add('counted'); return; }
  var target = parseInt(match[1], 10);
  if (target <= 0 || target > 9999) { el.classList.add('counted'); return; }
  var duration = 900;
  var start = performance.now();
  function tick(now) {
    var p = Math.min((now - start) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
    else { el.textContent = target; el.classList.add('counted'); }
  }
  el.textContent = '0';
  requestAnimationFrame(tick);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.classList.contains('counted')) {
      animateCounter(e.target);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat-number, .stat-num').forEach(el => statsObserver.observe(el));

// ---- Nav scroll shadow ----
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

// ---- Mobile menu ----
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ---- Passions modal (page d'accueil) ----
function openPassions() {
  var modal = document.getElementById('passionsModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', passionsKeyHandler);
}
function closePassions() {
  var modal = document.getElementById('passionsModal');
  if (!modal) return;
  modal.classList.remove('open');
  // Ne pas re-activer overflow si une autre modale (project-detail) est ouverte
  var projDetail = document.getElementById('projectDetail');
  if (!projDetail || !projDetail.classList.contains('open')) {
    document.body.style.overflow = '';
  }
  document.removeEventListener('keydown', passionsKeyHandler);
}
function passionsKeyHandler(e) {
  if (e.key === 'Escape') closePassions();
}

// ---- Scroll to top button ----
(function() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ---- CAROUSEL ----
(function() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const slides = Array.from(track.children);
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  const dotsContainer = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let currentIndex = 0;
  let autoplayInterval;
  let slidesPerView = 3;

  function getSlidesPerView() {
    if (window.innerWidth <= 768) return 1;
    // 2 cartes par vue sur tablette et desktop : les cartes au format portfolio
    // (texte gauche + logo droite) ont besoin de ~50% de largeur pour respirer.
    return 2;
  }

  function updateCarousel(animate) {
    slidesPerView = getSlidesPerView();
    const gap = 24;
    // On retire le padding horizontal du container : sinon les slides débordent à droite
    // et la dernière slide est partiellement coupée au max index.
    const parent = track.parentElement;
    const cs = getComputedStyle(parent);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const containerWidth = parent.offsetWidth - padX;
    const slideWidth = (containerWidth - gap * (slidesPerView - 1)) / slidesPerView;

    slides.forEach(s => { s.style.minWidth = slideWidth + 'px'; });

    const offset = currentIndex * (slideWidth + gap);
    track.style.transition = animate !== false ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    track.style.transform = 'translateX(-' + offset + 'px)';

    // Update dots
    if (dotsContainer) {
      const maxIndex = Math.max(0, totalSlides - slidesPerView);
      dotsContainer.innerHTML = '';
      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
        dot.addEventListener('click', () => { goToSlide(i); });
        dotsContainer.appendChild(dot);
      }
    }
  }

  function goToSlide(index) {
    const maxIndex = Math.max(0, totalSlides - getSlidesPerView());
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
    resetAutoplay();
  }

  function nextSlide() {
    const maxIndex = Math.max(0, totalSlides - getSlidesPerView());
    goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  }

  function prevSlide() {
    const maxIndex = Math.max(0, totalSlides - getSlidesPerView());
    goToSlide(currentIndex <= 0 ? maxIndex : currentIndex - 1);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 4000);
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  // Nav buttons
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Pause on hover
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  track.parentElement.addEventListener('mouseleave', startAutoplay);

  // Touch swipe
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  // Init
  updateCarousel(false);
  startAutoplay();
  window.addEventListener('resize', () => updateCarousel(false));
})();

// ---- Portfolio filter (Apple-style avec indicateur coulissant + compteur + bento adaptatif) ----

// Layouts pré-définis selon le nombre de cartes "normales" visibles (hors photo).
// Chaque entrée donne la séquence de classes bento à appliquer dans l'ordre.
var FILTER_LAYOUTS = {
  1: ['bento-full'],                                       // 1 carte → pleine largeur
  2: ['bento-feature', 'bento-feature'],                   // 2 cartes → 2 features côte à côte
  3: ['bento-xl', 'bento-tall', 'bento-wide'],             // 3 cartes → XL + tall, puis wide
  4: ['bento-xl', 'bento-tall', 'bento-half', 'bento-half']// 4 cartes → XL + tall, puis 2 halves
};

// Mémorise le bento d'origine sur chaque carte pour pouvoir restaurer après filtre
function memorizeOriginalBento() {
  var bentoClasses = ['bento-xl','bento-tall','bento-feature','bento-half','bento-third','bento-wide','bento-photo','bento-full'];
  document.querySelectorAll('#portfolioGrid .project-card').forEach(function(card) {
    if (!card.dataset.originalBento) {
      var orig = bentoClasses.find(function(c) { return card.classList.contains(c); });
      card.dataset.originalBento = orig || 'bento-half';
    }
  });
}

function applyBentoLayout(visibleCards) {
  var bentoClasses = ['bento-xl','bento-tall','bento-feature','bento-half','bento-third','bento-wide','bento-photo','bento-full'];

  // La carte photo (FCD) a une structure HTML différente : on la garde toujours en bento-photo
  var photoCard = visibleCards.find(function(c) { return c.dataset.originalBento === 'bento-photo'; });
  var normalCards = visibleCards.filter(function(c) { return c !== photoCard; });
  var nNormal = normalCards.length;

  var layout = FILTER_LAYOUTS[nNormal];

  if (layout) {
    // Layout adaptatif pour 1-4 cartes
    normalCards.forEach(function(card, i) {
      bentoClasses.forEach(function(c) { card.classList.remove(c); });
      card.classList.add(layout[i] || layout[layout.length - 1]);
    });
  } else {
    // 5+ cartes ou 0 → restaurer le layout d'origine (vue "Tous")
    normalCards.forEach(function(card) {
      bentoClasses.forEach(function(c) { card.classList.remove(c); });
      card.classList.add(card.dataset.originalBento);
    });
  }

  // La carte photo reste toujours bento-photo (structure spécifique)
  if (photoCard) {
    bentoClasses.forEach(function(c) { photoCard.classList.remove(c); });
    photoCard.classList.add('bento-photo');
  }
}

function filterProjects(cat, btn) {
  // Mémoriser le layout d'origine une fois pour toutes
  memorizeOriginalBento();

  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  // Affiche/cache les cartes + collecte les visibles
  var visibleCards = [];
  var visibleCount = 0;
  document.querySelectorAll('#portfolioGrid .project-card').forEach(function(card) {
    var match = (cat === 'all' || card.dataset.cat === cat);
    card.style.display = match ? '' : 'none';
    if (match) { visibleCount++; visibleCards.push(card); }
  });

  // Adapter le layout bento aux cartes visibles
  applyBentoLayout(visibleCards);

  // Met à jour le compteur avec petit flash émeraude
  var counter = document.getElementById('projectCount');
  if (counter) {
    counter.textContent = visibleCount;
    counter.classList.remove('flash');
    void counter.offsetWidth; // reflow
    counter.classList.add('flash');
  }

  positionFilterIndicator();
}

// Indicateur coulissant qui glisse sous le bouton actif
function positionFilterIndicator() {
  var bar = document.getElementById('portfolioFilters');
  if (!bar) return;
  var indicator = bar.querySelector('.filter-indicator');
  var active = bar.querySelector('.filter-btn.active');
  if (!indicator || !active) return;
  var barRect = bar.getBoundingClientRect();
  var btnRect = active.getBoundingClientRect();
  var x = btnRect.left - barRect.left;
  indicator.style.transform = 'translateX(' + x + 'px)';
  indicator.style.width = btnRect.width + 'px';
}

// Init au load + resize
window.addEventListener('load', positionFilterIndicator);
window.addEventListener('resize', positionFilterIndicator);
// Garde une initialisation immédiate au cas où le load tarde (polices, etc.)
document.addEventListener('DOMContentLoaded', function() {
  // Petit délai pour laisser la mise en page se stabiliser
  setTimeout(positionFilterIndicator, 50);
  setTimeout(positionFilterIndicator, 300);
});

// ---- Project detail ----
// Each project gets:
//  - logo: official logo file (banner image in hero)
//  - logoInvert: true if logo is dark and needs to be inverted on dark bg
//  - heroBg: 'vert' | 'bleu' | 'noir' | 'pastel' | 'blanc'
//  - tagline: 1-line punchy headline (Apple-style)
//  - highlights: 3 short feature blocks
//  - stats: 3 big-number stats (optional)
//  - showcase: featured image/video for hero showcase (optional)
const projectData = {
  industrie: {
    name: "L'Industrie Magnifique",
    logo: A + 'assets/images/logos/logo-industrie-magnifique.jpg',
    logoInvert: false,
    heroBg: 'vert',
    color: 'linear-gradient(135deg,#001C3C,#7FF9CF)',
    tagline: "Un rebranding 360° pour transformer un événement industriel en marque désirable.",
    title: "L'Industrie Magnifique — Rebranding Lyon 2027",
    client: "L'Industrie Magnifique",
    year: '2025',
    type: 'Branding & Stratégie 360°',
    intro: "Compétition d'agence pendant mon Mastère 2. L'Industrie Magnifique souhaitait repenser entièrement sa communication pour sa nouvelle édition prévue pour 2027. Leur problématique : comment accompagner le changement de nom vers une marque forte, désirable et compréhensible, capable de convaincre les mécènes, fédérer les artistes et attirer le grand public ?",
    mission: "Avec mon équipe, nous avons proposé un rebranding complet sous le nom de « ART&FACT — Entre savoir-faire & faire savoir ». L'équipe DA a créé l'ensemble de l'identité visuelle de la marque (logo, typographie, palettes de couleurs, symboliques industriel/artistique, affiches, flyers, bannières). L'équipe stratégie, dont je faisais partie, a élaboré la stratégie digitale et social media.",
    media: [
      { type: 'gallery', images: [
        { src: A + 'assets/images/im-slide-1.jpg', alt: 'Logo ART&FACT' },
        { src: A + 'assets/images/im-slide-2.jpg', alt: 'Bannières Grand Hôtel-Dieu' },
        { src: A + 'assets/images/im-slide-3.jpg', alt: 'Charte graphique complète' },
        { src: A + 'assets/images/im-slide-4.jpg', alt: 'Stratégie social media' },
        { src: A + 'assets/images/im-slide-6.jpg', alt: 'Supports print — Flyers' },
        { src: A + 'assets/images/im-slide-9.jpg', alt: 'Guerilla marketing — Clean tag' },
        { src: A + 'assets/images/im-slide-11.jpg', alt: 'Affichage métro Lyon' }
      ]},
      { type: 'doc', src: A + 'assets/docs/dossier-artfact.pdf', label: 'Consulter le dossier stratégique complet (PDF)' }
    ],
    results: ["Une identité visuelle complètement revue (logo, charte, déclinaisons…)", "Des mockups qui donnent envie", "Une stratégie 360° digitale et sur le terrain"],
    highlights: [
      { num: '01', title: "Une nouvelle marque", text: "ART&FACT — Entre savoir-faire & faire savoir. Un nom qui raconte l'union de l'art et de l'industrie." },
      { num: '02', title: "Un terrain conquis", text: "Des bannières au Grand Hôtel-Dieu, des affichages dans le métro, des clean tags. Faire connaître l'événement dans les rues de Lyon, mais aussi en ligne." },
      { num: '03', title: "Une stratégie 360°", text: "L'identité, le social media, le print, le guerilla marketing : on oriente tous les leviers sur notre promesse." }
    ]
  },
  oralia: {
    name: 'Oralia',
    logo: A + 'assets/images/logos/logo-oralia.svg',
    logoInvert: false,
    heroBg: 'pastel',
    color: 'linear-gradient(135deg,#0066FF,#00AAFF)',
    tagline: "Faire d'un métier en tension une marque employeur désirable.",
    title: 'Recommandation stratégique marque employeur',
    client: 'Oralia',
    year: '2024',
    type: 'Marque employeur & Stratégie',
    intro: "Compétition d'agence pendant mon Mastère 1. Oralia, un acteur majeur de la gestion immobilière française (42 agences et plus de 700 collaborateurs), faisait face à un défi de recrutement majeur. Le métier de gestionnaire de copropriétés attire de moins en moins, et ce malgré une rémunération attractive. Ils nous ont challengé pour rendre l'image de ce métier plus attractif aux yeux du grand public.",
    mission: "Avec l'agence fictive Eleven, nous avons proposé une recommandation stratégique complète. L'équipe stratégie, dont je faisais partie, a réalisé un audit de l'existant (réseaux sociaux, optiques de recrutement, site Internet…) ainsi qu'une stratégie de communication dédiée à la marque employeur. L'équipe DA a créé la plateforme de marque, un motion design de présentation du projet ainsi qu'une landing page en étroite collaboration avec l'équipe stratégique.",
    media: [
      { type: 'video', src: A + 'assets/videos/motion-oralia.mp4', label: 'Motion design de présentation' },
      { type: 'video', src: A + 'assets/videos/landing-oralia.mp4', label: 'Démo de la landing page' },
      { type: 'doc', src: A + 'assets/docs/dossier-oralia.pdf', label: 'Consulter le dossier complet (PDF)' }
    ],
    results: ["Un dossier stratégique complet (audit + recommandations)", "Un motion design de présentation produit", "Une landing page dédiée à la marque employeur"],
    highlights: [
      { num: '01', title: "Audit 360°", text: "Déconstruction de l'existant : réseaux sociaux, optiques de recrutement, site Internet." },
      { num: '02', title: "Plateforme de marque", text: "Une stratégie de communication dédiée à la marque employeur, pour rendre le métier désirable." },
      { num: '03', title: "Activation multi-canal", text: "Dossier stratégique, motion design produit et landing page créés en collaboration équipe stratégie + DA." }
    ]
  },
  bilum: {
    name: 'Bilum',
    logo: A + 'assets/images/logos/logo-bilum.jpg',
    logoInvert: false,
    heroBg: 'vert',
    color: 'linear-gradient(135deg,#2E7D32,#81C784)',
    tagline: "Une vidéo case climate-positive, pensée en deux semaines.",
    title: 'Vidéo case — Com for Climate 2025',
    client: 'Bilum',
    year: '2025',
    type: 'Vidéo & RSE',
    intro: "Dans le cadre de la compétition nationale de l'ESP « Com for Climate » 2025, mon équipe et moi devions réaliser une vidéo case pour la marque Bilum. Cette marque, spécialisée dans l'upcycling et la mode durable, avait besoin de nous pour développer sa notoriété BtoC sans perdre son ancrage BtoB.",
    mission: "En suivant leur brief, nous avons dispatché les tâches afin de réaliser une vidéo correspondant à leur besoin. Entre la recherche d'une stratégie, l'écriture du scénario, le montage et la production finale, chacun a apporté sa pierre à l'édifice. L'objectif : mettre en valeur l'engagement RSE de Bilum et proposer une stratégie climate-positive.",
    media: [{ type: 'video', src: A + 'assets/videos/video-bilum.mp4', label: 'Vidéo case Bilum — Com for Climate 2025' }],
    results: ["Une vidéo case produite en 2 semaines", "La création d'un scénario et d'une stratégie RSE", "Une compétition inter-écoles pour Com for Climate"],
    highlights: [
      { num: '01', title: "Sprint créatif", text: "2 semaines pour élaborer une stratégie et proposer une vidéo case engagée." },
      { num: '02', title: "RSE en avant", text: "Le challenge : mettre en valeur l'upcycling sans tomber dans le greenwashing." },
      { num: '03', title: "La production", text: "De l'écriture au montage, nous avons créé une chaîne de production complète." }
    ]
  },
  cavissima: {
    name: 'Cavissima',
    logo: A + 'assets/images/logos/logo-cavissima.png',
    logoInvert: false,
    heroBg: 'bleu',
    color: 'linear-gradient(135deg,#6B2D5B,#9B4D8B)',
    tagline: "9 mois de social media pour une entreprise e-commerce de vin.",
    title: 'Animation réseaux sociaux & influence',
    client: 'Cavissima',
    year: '2024-2025',
    type: 'Social Media & Influence',
    intro: "Cavissima est une plateforme e-commerce spécialisée dans la vente de vins et spiritueux. Lors de mon alternance chez eux, j'ai pris en main l'animation de leurs réseaux sociaux.",
    mission: "Pendant plus de 9 mois, j'ai créé et publié l'ensemble des contenus Instagram et Facebook de l'entreprise. De l'animation de la communauté (stories & publications) à l'organisation de partenariats et promotions, j'ai suivi l'ensemble des KPIs afin d'améliorer la visibilité de la marque.",
    media: [
      { type: 'instagram', src: 'https://www.instagram.com/cavissima/', handle: '@cavissima', label: "Voir le compte Instagram que j'ai animé de septembre 2024 à août 2025" }
    ],
    results: ["+100 contenus créés", "Gestion des comptes Instagram & Facebook", "Partenariats avec des influenceurs", "Création de contenus vidéos et visuels"],
    stats: [
      { num: '9', label: "mois d'animation continue" },
      { num: '100', label: "+ contenus publiés" },
      { num: '2', label: "réseaux pilotés en parallèle" }
    ],
    highlights: [
      { num: '01', title: "Animation régulière", text: "Création et publication de l'ensemble des contenus Instagram et Facebook de septembre 2024 à août 2025." },
      { num: '02', title: "Recherche d'influenceurs", text: "Recherche ciblée d'influenceurs viticoles, organisations de concours et création de contenus promotionnels." },
      { num: '03', title: "Pilotage via la donnée", text: "Suivi des KPIs, reporting régulier et arbitrages basés sur la performance de la marque." }
    ]
  },
  cavissima2: {
    name: 'Cavissima',
    logo: A + 'assets/images/logos/logo-cavissima.png',
    logoInvert: false,
    heroBg: 'pastel',
    color: 'linear-gradient(135deg,#6B2D5B,#9B4D8B)',
    tagline: "Du SEO au stylo : 6 articles, des newsletters, et le trafic qui suit.",
    title: "Rédaction d'articles & content marketing",
    client: 'Cavissima',
    year: '2024-2025',
    type: 'SEO, SEA & Contenu',
    intro: "Cavissima est une plateforme e-commerce spécialisée dans la vente de vins et spiritueux. Lors de mon alternance chez eux, j'ai travaillé sur le volet acquisition et contenus. De la gestion du SEO et SEA à la rédaction d'articles de blog et de newsletters, le but était de développer le trafic et la notoriété de Cavissima.",
    mission: "J'ai rédigé et publié 6 articles de blog. J'ai également optimisé l'ensemble des articles de blog du site (méta-description, balises alt, headers, SEO…). J'ai optimisé des contenus SEA avec le directeur marketing. J'ai créé et rédigé des newsletters promotionnelles et internes trimestrielles tout en accompagnant les différentes équipes de l'entreprise.",
    media: [{ type: 'articles', items: [
      { title: 'Alfred Hitchcock, un passionné du vin', url: 'https://blog.cavissima.com/alfred-hitchcock-un-passionne-du-vin.html', img: 'https://blog.cavissima.com/wp-content/uploads/2018/11/Vin-et-gibier-1-600x350.jpg' },
      { title: "Château d'Yquem 2022 — Un millésime exceptionnel", url: 'https://blog.cavissima.com/chateau-dyquem-2022-un-millesime-exceptionnel.html', img: 'https://blog.cavissima.com/wp-content/uploads/2025/03/Sans-titre-1024-x-683-px-1-300x200.png' },
      { title: 'Le calendrier des Primeurs Bordeaux 2024', url: 'https://blog.cavissima.com/le-calendrier-des-primeurs-bordeaux-2024.html', img: 'https://blog.cavissima.com/wp-content/uploads/2025/03/Sans-titre-1024-x-683-px-2-300x200.png' },
      { title: "Accords mets & vin de Noël — Les plats", url: 'https://blog.cavissima.com/accords-mets-vin-noel-plat.html', img: 'https://blog.cavissima.com/wp-content/uploads/2018/11/Vin-et-gibier-1-600x350.jpg' },
      { title: 'Accords mets & vin — Fromages & Desserts', url: 'https://blog.cavissima.com/accords-mets-vin-fromages-desserts.html', img: 'https://blog.cavissima.com/wp-content/uploads/2025/03/Sans-titre-1024-x-683-px-1-300x200.png' },
      { title: "Accords mets & vin de Noël — Les entrées", url: 'https://blog.cavissima.com/accords-mets-vin-noel-les-entrees.html', img: 'https://blog.cavissima.com/wp-content/uploads/2025/03/Sans-titre-1024-x-683-px-2-300x200.png' }
    ]}],
    results: ["6 articles de blog rédigés et publiés", "Newsletters promotionnelles et internes trimestrielles", "Optimisation SEO et SEA du site e-commerce"],
    stats: [
      { num: '6', label: "articles de blog publiés" },
      { num: '4', label: "newsletters trimestrielles" },
      { num: '3', label: "équipes accompagnées" }
    ],
    highlights: [
      { num: '01', title: "Rédaction d'articles", text: "6 articles de blog publiés, optimisés SEO sur des sujets autour du vin." },
      { num: '02', title: "Newsletters", text: "Rédaction de newsletters promotionnelles et internes trimestrielles." },
      { num: '03', title: "Accompagnement", text: "Travail conjoint avec les équipes marketing, produits et commerciale." }
    ]
  },
  bpaura: {
    name: 'BPAURA',
    logo: A + 'assets/images/logos/logo-bpaura.png',
    logoInvert: false,
    heroBg: 'blanc',
    color: 'linear-gradient(135deg,#2B4C7E,#5B7FAD)',
    tagline: "Rendre la connaissance client accessible à toutes les agences.",
    title: 'Communication digitale & IA — Formation & KYC',
    client: 'Banque Populaire Auvergne-Rhône-Alpes',
    year: '2025-2026',
    type: 'Communication & Formation',
    intro: "En alternance au sein de la BPAURA en tant que chargé de communication digitale et IA, je travaille à la croisée de la communication interne et de la pédagogie. Mon rôle : rendre accessibles des sujets complexes (connaissance client, KYC, risques) aux collaborateurs d'agences.",
    mission: "Idéation et élaboration de supports sur le KYC à destination des collaborateurs d'agences. Création de tutoriels sur le KYC. Développement de capsules de formation autour de différents thèmes sur la connaissance client. Communications internes pour le contrôle permanent et la direction des risques.",
    results: ["Supports KYC créés et déployés auprès des agences", "Capsules de formation produites sur la connaissance client", "Communications internes structurées pour deux directions"],
    highlights: [
      { num: '01', title: "Pédagogie KYC", text: "Vulgariser des sujets réglementaires complexes pour les collaborateurs d'agences." },
      { num: '02', title: "Formats variés", text: "Tutoriels, capsules vidéo, supports écrits : adapter le format à chaque message." },
      { num: '03', title: "Communication interne", text: "Structurer la prise de parole de la direction des risques et du contrôle permanent." }
    ]
  },
  bpaura2: {
    name: 'BPAURA',
    logo: A + 'assets/images/logos/logo-bpaura.png',
    logoInvert: true,
    heroBg: 'bleu',
    color: 'linear-gradient(135deg,#2B4C7E,#5B7FAD)',
    tagline: "Une mascotte digitale pour humaniser la direction des risques.",
    title: "Création de mascotte & identité visuelle interne",
    client: 'Banque Populaire Auvergne-Rhône-Alpes',
    year: '2025-2026',
    type: 'Création & Branding interne',
    intro: "Parmi mes missions à la BPAURA, j'ai dû concevoir une mascotte digitale pour la direction des risques. C'est un projet créatif ayant pour but d'humaniser la communication interne sur les sujets techniques et réglementaires de la connaissance client.",
    mission: "J'ai créé une mascotte pour l'ensemble de la direction des risques à l'aide de l'intelligence artificielle. Cette mascotte, que j'ai appelée Simon en référence à Timon du Roi Lion, est intégrée dans l'ensemble des communications du contrôle permanent. L'objectif est de rendre les sujets liés à la conformité et aux risques plus digestes et engageants pour l'ensemble des collaborateurs réseau de BPAURA.",
    results: ["Mascotte créée et validée par la direction des risques", "Intégrée aux supports de communication internes", "Une approche créative appliquée au contexte corporate de l'entreprise"],
    highlights: [
      { num: '01', title: "Une image forte", text: "Une mascotte pensée pour incarner l'esprit de la direction des risques." },
      { num: '02', title: "Une identité unique", text: "Des visuels de la mascotte intégrables à tous les supports internes de la direction des risques." },
      { num: '03', title: "Engager les collaborateurs", text: "Humaniser les contenus du contrôle permanent pour stimuler l'attention des collaborateurs." }
    ]
  },
  ef: {
    name: 'Education First',
    logo: A + 'assets/images/logos/logo-ef.png',
    logoInvert: false,
    heroBg: 'blanc',
    color: 'linear-gradient(135deg,#C4262E,#E8573A)',
    tagline: "Coordonner le sponsoring d'une marque mondiale sur la Coupe du Monde de rugby.",
    title: 'Campagnes social media & Coupe du Monde de rugby 2023',
    client: 'Education First France',
    year: '2023',
    type: 'Social Media & Événementiel',
    intro: "Quand j'étais ambassadeur chez EF France, j'ai aidé au pilotage de campagnes de communication sur les réseaux sociaux et aidé à coordonner le sponsoring d'EF lors de la Coupe du Monde de rugby 2023.",
    mission: "J'ai promu des offres de l'entreprise et créé des contenus sur les réseaux sociaux. Entre la création de contenus (stories, flyers, vidéo YouTube), j'ai pu aider et monter en compétences bénévolement sur des petits sujets de communication.",
    media: [{ type: 'youtube', src: 'O2kYxi3k2Gg', label: 'Ma vidéo YouTube — Présentation Education First' }],
    results: ["Sponsoring EF lors de la Coupe du Monde de rugby 2023", "Contenus créatifs multi-formats", "Visibilité de la marque EF renforcée"],
    highlights: [
      { num: '01', title: "Pilotage social media", text: "Promotion d'offres EF et création de contenus stories, flyers, vidéos sur les réseaux sociaux." },
      { num: '02', title: "Coordination événement", text: "Coordination du sponsoring EF lors de la Coupe du Monde de rugby 2023." },
      { num: '03', title: "Montée en compétences", text: "Bénévolement, j'ai aidé sur de petits sujets de communication pour monter en expérience." }
    ]
  },
  photo: {
    name: 'FCD Pictures',
    logo: null,
    logoInvert: false,
    heroBg: 'noir',
    color: 'linear-gradient(135deg,#1a1a2e,#16213e)',
    tagline: "Entre paysages, portraits et mises en scène, je présente mes clichés sur Instagram.",
    title: 'Compte de photographie Instagram',
    client: 'Projet personnel',
    year: 'En cours',
    type: 'Photographie',
    intro: "Je publie de temps à autre des clichés pris avec mon appareil photo sur mon compte Instagram @fcd_pictures. Entre portraits, paysages et mises en scène… Je m'essaye à cet art avec mon Canon EOS R50.",
    mission: "Des clichés, des portraits… J'essaye tout type de photographies.",
    media: [
      { type: 'instagram', src: 'https://www.instagram.com/fcd_pictures/', handle: '@fcd_pictures', label: 'Voir mon compte personnel de photographie' },
      { type: 'gallery', images: [
        { src: A + 'assets/images/fcd/IMG_3217.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3274.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3095.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3089.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3035.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3026.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3023.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3017.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_2994.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_2975.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3667.JPG', alt: 'Photographie FCD Pictures' },
        { src: A + 'assets/images/fcd/IMG_3400.JPG', alt: 'Photographie FCD Pictures' }
      ]}
    ],
    results: ["Des photographies uniques", "Un regard créatif", "Des compositions amateurs"],
    highlights: null
  },
  explore: {
    name: 'Explore',
    logo: A + 'assets/images/logos/logo-explore.png',
    logoInvert: false,
    heroBg: 'noir',
    color: 'linear-gradient(135deg,#0F1A14,#2D5128)',
    tagline: "Une application mobile pour digital nomads, créée avec Claude Code.",
    title: 'Application mobile Explore',
    client: 'Projet personnel',
    year: '2026',
    type: 'Application mobile & Vibe coding',
    intro: "Explore est une application mobile pensée pour les digital nomads — celles et ceux qui travaillent depuis n'importe où dans le monde. Conçue de A à Z avec Claude Code, elle combine UX moderne et fonctionnalités utiles aux travailleurs nomades.",
    mission: "Développement complet de l'application mobile en React Native / Expo : architecture, design system, écrans, navigation, données, exports web. Tout a été pensé, prototypé et codé en pair-programming avec Claude. L'app est déployable en standalone HTML pour partage rapide.",
    media: [
      { type: 'iframe', src: A + 'assets/explore-app/Explore.html', label: "Aperçu de l'application — clique pour interagir", frame: 'phone' }
    ],
    results: ["Application fonctionnelle déployable en HTML standalone", "Design system maison (couleurs, typo, composants)", "Expérimentation complète du vibe coding avec Claude Code"],
    highlights: [
      { num: '01', title: "Vibe coding", text: "Conception, prototypage et développement entièrement réalisés avec Claude Code en pair-programming." },
      { num: '02', title: "Pour digital nomads", text: "Une app pensée pour la vie en mouvement : recherche de spots, communauté, ressources pratiques." },
      { num: '03', title: "Cross-plateforme", text: "Construite avec Expo / React Native, exportable en web pour partage rapide." }
    ]
  }
};

// ---------- Apple MacBook Pro–style media renderers ----------
function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

// Mockup 3x3 fiable (sans appel externe) — style profil Instagram cliquable.
// Mode 'images'   : URLs locales (idéal si on a les vraies captures)
// Mode 'gradient' : tuiles dégradées + emoji (pur placeholder)
// Mode 'auto'     : essaie d'abord src, fallback gradient en cas d'erreur de chargement
var INSTA_TILES = {
  'fcd_pictures': {
    type: 'images',
    label: '23 publications',
    avatar: 'F',
    tiles: [
      A + 'assets/images/fcd/IMG_3217.JPG', A + 'assets/images/fcd/IMG_3274.JPG', A + 'assets/images/fcd/IMG_3400.JPG',
      A + 'assets/images/fcd/IMG_3667.JPG', A + 'assets/images/fcd/IMG_3755.JPG', A + 'assets/images/fcd/IMG_3791.JPG',
      A + 'assets/images/fcd/IMG_2975.JPG', A + 'assets/images/fcd/IMG_3017.JPG', A + 'assets/images/fcd/IMG_3155.JPG'
    ]
  },
  'cavissima': {
    type: 'auto',
    label: '9 mois d’animation · vins & spiritueux',
    avatar: 'C',
    // Pose tes captures dans assets/images/cavissima-insta/ (post-1.jpg à post-9.jpg)
    // pour afficher les vrais posts. Sinon, fallback gradient automatique.
    tiles: [
      { src: A + 'assets/images/cavissima-insta/post-1.jpg', bg: 'linear-gradient(135deg,#6B2D5B,#9B4D8B)', icon: '🍷' },
      { src: A + 'assets/images/cavissima-insta/post-2.jpg', bg: 'linear-gradient(135deg,#5C1A2B,#8E2C42)', icon: '🍇' },
      { src: A + 'assets/images/cavissima-insta/post-3.jpg', bg: 'linear-gradient(135deg,#3D2914,#7A4A1F)', icon: '✨' },
      { src: A + 'assets/images/cavissima-insta/post-4.jpg', bg: 'linear-gradient(135deg,#8E2C42,#C04060)', icon: '🏆' },
      { src: A + 'assets/images/cavissima-insta/post-5.jpg', bg: 'linear-gradient(135deg,#1F2937,#4B5563)', icon: '🍾' },
      { src: A + 'assets/images/cavissima-insta/post-6.jpg', bg: 'linear-gradient(135deg,#7A4A1F,#B07435)', icon: '📈' },
      { src: A + 'assets/images/cavissima-insta/post-7.jpg', bg: 'linear-gradient(135deg,#9B4D8B,#C76FA8)', icon: '🍷' },
      { src: A + 'assets/images/cavissima-insta/post-8.jpg', bg: 'linear-gradient(135deg,#4B5563,#6B7280)', icon: '📸' },
      { src: A + 'assets/images/cavissima-insta/post-9.jpg', bg: 'linear-gradient(135deg,#6B2D5B,#3D1A33)', icon: '🏰' }
    ]
  }
};

// Helper appelé en cas d'erreur de chargement d'une image insta : remplace par un dégradé.
window.instaFallback = function(img) {
  var d = document.createElement('div');
  d.className = 'insta-tile';
  d.style.background = img.getAttribute('data-fallback-bg') || 'linear-gradient(135deg,#222,#444)';
  d.textContent = img.getAttribute('data-fallback-icon') || '';
  if (img.parentNode) img.parentNode.replaceChild(d, img);
};

function renderInstaPreview(handleUrl, handle, label) {
  var key = (handle || '').replace(/^@/, '').toLowerCase();
  var data = INSTA_TILES[key] || INSTA_TILES['cavissima']; // fallback gradient
  var igSvg = '<svg width="28" height="28" viewBox="0 0 24 24" fill="url(#g)"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#833AB4"/><stop offset=".5" stop-color="#E1306C"/><stop offset="1" stop-color="#F77737"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>';

  var tilesHtml = '';
  if (data.type === 'images') {
    tilesHtml = data.tiles.map(function(src) {
      return '<img src="' + escAttr(src) + '" alt="" loading="lazy" onerror="this.style.background=\'linear-gradient(135deg,#222,#444)\';this.removeAttribute(\'src\');">';
    }).join('');
  } else if (data.type === 'auto') {
    // Essaie l'image locale ; si elle n'existe pas, instaFallback affiche un dégradé.
    tilesHtml = data.tiles.map(function(t) {
      return '<img src="' + escAttr(t.src) + '" alt="" loading="lazy" ' +
        'data-fallback-bg="' + escAttr(t.bg) + '" data-fallback-icon="' + escAttr(t.icon || '') + '" ' +
        'onerror="window.instaFallback && window.instaFallback(this)">';
    }).join('');
  } else {
    tilesHtml = data.tiles.map(function(t) {
      return '<div class="insta-tile" style="background:' + t.bg + '">' + t.icon + '</div>';
    }).join('');
  }

  return '<a class="insta-mockup" href="' + escAttr(handleUrl) + '" target="_blank" rel="noopener" aria-label="Voir ' + escAttr(handle) + ' sur Instagram">' +
    '<div class="insta-mockup-inner">' +
      '<div class="insta-mockup-header">' +
        '<div class="insta-mockup-avatar"><div class="insta-mockup-avatar-inner">' + escAttr(data.avatar || handle.charAt(1).toUpperCase()) + '</div></div>' +
        '<div class="insta-mockup-handle-block">' +
          '<div class="insta-mockup-handle">' + handle + '</div>' +
          '<div class="insta-mockup-meta">' + escAttr(data.label || '') + (label ? ' \u00b7 ' + escAttr(label) : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="insta-mockup-grid">' + tilesHtml + '</div>' +
      '<div class="insta-mockup-cta-bar">' +
        '<span class="insta-mockup-cta-text">' + igSvg.replace('width="28" height="28"', 'width="18" height="18"') + ' <span style="margin-left:10px;vertical-align:middle">Aper\u00e7u du feed</span></span>' +
        '<span class="insta-mockup-cta">Voir sur Instagram \u2192</span>' +
      '</div>' +
    '</div>' +
  '</a>';
}

function renderArticlesGrid(items) {
  return '<div class="blog-articles-grid">' + items.map(function(a) {
    var img = a.img || '';
    var imgStyle = img ? '' : 'background:linear-gradient(135deg,#6B2D5B,#9B4D8B);';
    return '<a class="blog-article-card" href="' + escAttr(a.url) + '" target="_blank" rel="noopener">' +
      (img
        ? '<img class="blog-article-img" src="' + escAttr(img) + '" alt="' + escAttr(a.title) + '" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="blog-article-img" style="' + imgStyle + '"></div>') +
      '<div class="blog-article-body">' +
        '<div class="blog-article-source">blog.cavissima.com</div>' +
        '<div class="blog-article-title">' + a.title + '</div>' +
        '<span class="blog-article-arrow">Lire l\'article \u2192</span>' +
      '</div>' +
    '</a>';
  }).join('') + '</div>';
}

function renderAppleGallery(images) {
  return '<div class="detail-gallery-apple">' + images.map(function(img) {
    return '<img src="' + escAttr(img.src) + '" alt="' + escAttr(img.alt || '') + '" onclick="openLightbox(this.src)" loading="lazy" onerror="this.parentElement.removeChild(this)">';
  }).join('') + '</div>';
}

function renderShowcaseMedia(media) {
  // Picks the first relevant media (video / youtube / doc) for showcase block
  if (!media || !media.length) return '';
  var html = '';
  media.forEach(function(m) {
    if (m.type === 'video') {
      html += '<div class="detail-showcase"><video controls preload="metadata"><source src="' + escAttr(m.src) + '" type="video/mp4"></video></div>';
      if (m.label) html += '<p style="text-align:center;font-size:13px;opacity:0.6;margin-top:14px">' + m.label + '</p>';
    } else if (m.type === 'youtube') {
      html += '<a href="https://www.youtube.com/watch?v=' + escAttr(m.src) + '" target="_blank" style="display:block"><div class="detail-showcase media-youtube" style="background-image:url(\'https://img.youtube.com/vi/' + escAttr(m.src) + '/maxresdefault.jpg\')"><div class="yt-play"></div></div></a>';
      if (m.label) html += '<p style="text-align:center;font-size:13px;opacity:0.6;margin-top:14px">' + m.label + '</p>';
    } else if (m.type === 'doc') {
      html += '<div style="text-align:center;margin-top:32px"><a class="media-doc-link" href="' + escAttr(m.src) + '" target="_blank">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        m.label + '</a></div>';
    }
  });
  return html;
}

function buildHighlights(highlights) {
  if (!highlights || !highlights.length) return '';
  return '<div class="detail-highlights">' + highlights.map(function(h) {
    return '<div class="highlight-card">' +
      '<div class="highlight-num">' + h.num + '</div>' +
      '<h3>' + h.title + '</h3>' +
      '<p>' + h.text + '</p>' +
    '</div>';
  }).join('') + '</div>';
}

function buildStats(stats) {
  if (!stats || !stats.length) return '';
  return '<div class="detail-stats">' + stats.map(function(s) {
    return '<div class="stat-item">' +
      '<div class="stat-num">' + s.num + '</div>' +
      '<div class="stat-label">' + s.label + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

// Renderer iframe — affichage d'une app web (HTML standalone) dans un mockup téléphone
function renderIframeMockup(m) {
  var src = escAttr(m.src);
  if (m.frame === 'phone') {
    return '<div class="cinema-phone-mockup">' +
      '<div class="cinema-phone-frame">' +
        '<div class="cinema-phone-notch"></div>' +
        '<iframe class="cinema-phone-iframe" src="' + src + '" title="Aperçu de l\'application" loading="lazy" ' +
          'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"></iframe>' +
      '</div>' +
      (m.label ? '<p class="cinema-phone-label">' + m.label + '</p>' : '') +
      '<a class="cinema-phone-cta" href="' + src + '" target="_blank" rel="noopener">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
        ' Ouvrir en plein écran' +
      '</a>' +
    '</div>';
  }
  // Default fallback : iframe pleine largeur dans une showcase
  return '<div class="detail-showcase"><iframe src="' + src + '" loading="lazy" style="width:100%;min-height:600px;border:0;display:block"></iframe></div>';
}

function buildMediaSection(media) {
  // Render the visual showcase: Instagram preview, articles grid, gallery, video, iframe
  if (!media || !media.length) return '';
  var html = '';
  media.forEach(function(m) {
    if (m.type === 'instagram') {
      html += renderInstaPreview(m.src, m.handle, m.label);
    } else if (m.type === 'articles') {
      html += renderArticlesGrid(m.items);
    } else if (m.type === 'gallery') {
      html += renderAppleGallery(m.images);
    } else if (m.type === 'iframe') {
      html += renderIframeMockup(m);
    } else if (m.type === 'video' || m.type === 'youtube' || m.type === 'doc') {
      html += renderShowcaseMedia([m]);
    }
  });
  return html;
}

// ============================================
// CINEMATIC PROJECT DETAIL — 5 actes plein écran
// Navigation fluide : progress bar, side nav dots, scroll smooth, clavier
// ============================================
function buildCinemaHighlights(highlights) {
  if (!highlights || !highlights.length) return '';
  return '<div class="cinema-highlights">' + highlights.map(function(h) {
    return '<div class="cinema-highlight">' +
      '<div class="cinema-highlight-num">' + h.num + '</div>' +
      '<h3>' + h.title + '</h3>' +
      '<p>' + h.text + '</p>' +
    '</div>';
  }).join('') + '</div>';
}

function buildCinemaStats(stats) {
  if (!stats || !stats.length) return '';
  return '<div class="cinema-stats">' + stats.map(function(s) {
    return '<div class="cinema-stat">' +
      '<div class="cinema-stat-num" data-target="' + escAttr(s.num) + '">' + s.num + '</div>' +
      '<div class="cinema-stat-label">' + s.label + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function shouldInvertLogo(p, heroBg) {
  if (p.logoInvert === false) return false;
  return p.logoInvert === true && (heroBg === 'vert' || heroBg === 'bleu' || heroBg === 'noir');
}

function openProject(id) {
  var p = projectData[id]; if (!p) return;
  var heroBg = p.heroBg || 'vert';

  var allIds = Object.keys(projectData);
  var currentIdx = allIds.indexOf(id);
  var prevId = currentIdx > 0 ? allIds[currentIdx - 1] : allIds[allIds.length - 1];
  var nextId = currentIdx < allIds.length - 1 ? allIds[currentIdx + 1] : allIds[0];
  var prevP = projectData[prevId];
  var nextP = projectData[nextId];

  var bgDefi    = (heroBg === 'pastel' || heroBg === 'blanc') ? 'vert'  : 'pastel';
  var bgMission = 'blanc';
  var bgImpact  = (heroBg === 'vert' || heroBg === 'bleu' || heroBg === 'noir') ? 'noir' : 'vert';
  var bgEnd     = 'pastel';

  var acts = [
    { num: '01', label: 'Couverture' },
    { num: '02', label: 'Le défi' },
    { num: '03', label: 'Ma mission' },
    { num: '04', label: 'L’impact' },
    { num: '05', label: 'Et après' }
  ];

  var logoClass = shouldInvertLogo(p, heroBg) ? ' logo-white' : '';
  var logoHtml = p.logo
    ? '<img class="cinema-cover-logo' + logoClass + '" src="' + escAttr(p.logo) + '" alt="' + escAttr(p.name) + '">'
    : '';

  var html = '<div class="cinema-detail">';

  html += '<div class="cinema-progress-bar"><div class="cinema-progress-fill" id="cinemaProgressFill"></div></div>';

  html += '<nav class="cinema-nav" aria-label="Navigation entre les actes">';
  acts.forEach(function(act) {
    html += '<a href="#act-' + act.num + '" class="cinema-nav-dot" data-act="' + act.num + '">' +
      '<span class="cinema-nav-num">' + act.num + '</span>' +
      '<span class="cinema-nav-label">' + act.label + '</span>' +
    '</a>';
  });
  html += '</nav>';

  // ACT 01 - COVER
  html += '<section id="act-01" class="cinema-act cinema-cover bg-' + heroBg + '">' +
    '<div class="cinema-act-eyebrow">Act 01 / 05</div>' +
    logoHtml +
    '<h1 class="cinema-cover-title">' + p.name + '</h1>' +
    '<p class="cinema-cover-tagline">' + (p.tagline || p.title) + '</p>' +
    '<div class="cinema-cover-meta">' +
      '<span>' + p.year + '</span><span>&middot;</span><span>' + p.client + '</span><span>&middot;</span><span>' + p.type + '</span>' +
    '</div>' +
    '<div class="cinema-scroll-hint"><span>Scroll</span><div class="arrow"></div></div>' +
  '</section>';

  // ACT 02 - LE DEFI
  html += '<section id="act-02" class="cinema-act cinema-defi bg-' + bgDefi + '">' +
    '<div class="cinema-act-eyebrow">Act 02 / 05 — Le défi</div>' +
    '<blockquote class="cinema-defi-quote">' + p.intro + '</blockquote>' +
  '</section>';

  // ACT 03 - MA MISSION
  html += '<section id="act-03" class="cinema-act cinema-mission bg-' + bgMission + '">' +
    '<div class="cinema-act-eyebrow">Act 03 / 05 — Ma mission</div>' +
    '<h2>Ce que j’ai fait</h2>' +
    '<p class="cinema-lead">' + p.mission + '</p>' +
    buildCinemaHighlights(p.highlights) +
    (p.media && p.media.length
      ? '<div class="cinema-media-block">' + buildMediaSection(p.media) + '</div>'
      : '') +
  '</section>';

  // ACT 04 - L'IMPACT
  html += '<section id="act-04" class="cinema-act cinema-impact bg-' + bgImpact + '">' +
    '<div class="cinema-act-eyebrow">Act 04 / 05 — L’impact</div>' +
    '<h2>L’impact concret du projet</h2>' +
    buildCinemaStats(p.stats) +
    '<ul class="cinema-results">' +
      p.results.map(function(r) {
        return '<li><span class="cinema-results-icon">→</span><span>' + r + '</span></li>';
      }).join('') +
    '</ul>' +
  '</section>';

  // ACT 05 - ET APRES
  html += '<section id="act-05" class="cinema-act cinema-end bg-' + bgEnd + '">' +
    '<div class="cinema-act-eyebrow">Act 05 / 05 — Et après</div>' +
    '<h2>Continuer la visite</h2>' +
    '<div class="cinema-nav-projects">' +
      '<a class="cinema-nav-project prev" onclick="openProject(\'' + escAttr(prevId) + '\')">' +
        '<span class="cinema-nav-arrow">←</span>' +
        '<span class="cinema-nav-project-block">' +
          '<span class="cinema-nav-project-label">Projet précédent</span>' +
          '<span class="cinema-nav-project-name">' + prevP.name + '</span>' +
        '</span>' +
      '</a>' +
      '<a class="cinema-nav-project next" onclick="openProject(\'' + escAttr(nextId) + '\')">' +
        '<span class="cinema-nav-arrow">→</span>' +
        '<span class="cinema-nav-project-block">' +
          '<span class="cinema-nav-project-label">Projet suivant</span>' +
          '<span class="cinema-nav-project-name">' + nextP.name + '</span>' +
        '</span>' +
      '</a>' +
    '</div>' +
    '<button class="cinema-back-btn" onclick="closeProject()">↩ Retour au portfolio</button>' +
  '</section>';

  html += '</div>';

  document.getElementById('projectDetailContent').innerHTML = html;
  document.getElementById('projectDetail').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('projectDetail').scrollTop = 0;

  setupCinemaNavigation();
}

// === Setup scroll progress + active dot + smooth scroll + keyboard ===
function setupCinemaNavigation() {
  var detail = document.getElementById('projectDetail');
  if (!detail) return;
  var progressFill = document.getElementById('cinemaProgressFill');
  var dots = detail.querySelectorAll('.cinema-nav-dot');
  var acts = detail.querySelectorAll('.cinema-act');

  function onScroll() {
    var scrollTop = detail.scrollTop;
    var scrollHeight = detail.scrollHeight - detail.clientHeight;
    var progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
    if (progressFill) progressFill.style.width = progress + '%';

    var center = scrollTop + detail.clientHeight * 0.4;
    var activeIdx = 0;
    acts.forEach(function(act, i) {
      if (act.offsetTop <= center) activeIdx = i;
    });
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === activeIdx);
    });

    var impactAct = detail.querySelector('.cinema-impact');
    if (impactAct && impactAct.offsetTop - 200 < scrollTop + detail.clientHeight) {
      detail.querySelectorAll('.cinema-stat-num:not(.counted)').forEach(function(el) {
        if (typeof animateCounter === 'function') animateCounter(el);
      });
    }
  }

  if (detail._cinemaScroll) detail.removeEventListener('scroll', detail._cinemaScroll);
  detail._cinemaScroll = onScroll;
  detail.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  dots.forEach(function(dot) {
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = dot.getAttribute('href');
      var target = detail.querySelector(targetId);
      if (target) {
        detail.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    });
  });

  document.removeEventListener('keydown', cinemaKeyHandler);
  document.addEventListener('keydown', cinemaKeyHandler);
}

function cinemaKeyHandler(e) {
  var detail = document.getElementById('projectDetail');
  if (!detail || !detail.classList.contains('open')) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'PageDown' && e.key !== 'PageUp') return;
  e.preventDefault();
  var acts = detail.querySelectorAll('.cinema-act');
  if (!acts.length) return;
  var scrollTop = detail.scrollTop;
  var current = 0;
  acts.forEach(function(a, i) { if (a.offsetTop - 80 <= scrollTop) current = i; });
  var direction = (e.key === 'ArrowDown' || e.key === 'PageDown') ? 1 : -1;
  var target = Math.max(0, Math.min(acts.length - 1, current + direction));
  detail.scrollTo({ top: acts[target].offsetTop, behavior: 'smooth' });
}

function closeProject() {
  document.getElementById('projectDetail').classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', cinemaKeyHandler);
}


// ---- Lightbox ----
function openLightbox(src) {
  var lb = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  if (!document.getElementById('projectDetail') || !document.getElementById('projectDetail').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeProject(); closeLightbox(); }
});

// ---- Countdown 31 mai 2026 (avec pulse à chaque tick) ----
(function() {
  var daysEl = document.getElementById('cd-days');
  if (!daysEl) return;
  var target = new Date('2026-05-31T00:00:00').getTime();
  var lastVals = { days: null, hours: null, mins: null, secs: null };

  function setVal(id, val, key) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    if (lastVals[key] !== null && lastVals[key] !== val) {
      // valeur a changé : déclenche le pulse
      el.classList.remove('cd-pulse');
      void el.offsetWidth; // reflow pour relancer l'animation
      el.classList.add('cd-pulse');
    }
    lastVals[key] = val;
  }

  function update() {
    var now = Date.now();
    var diff = target - now;
    if (diff <= 0) {
      setVal('cd-days', '0', 'days');
      setVal('cd-hours', '0', 'hours');
      setVal('cd-mins', '0', 'mins');
      setVal('cd-secs', '0', 'secs');
      var label = document.querySelector('.countdown-label');
      if (label) label.textContent = 'Le livre blanc est disponible !';
      return;
    }
    setVal('cd-days',  Math.floor(diff / 86400000), 'days');
    setVal('cd-hours', Math.floor((diff % 86400000) / 3600000), 'hours');
    setVal('cd-mins',  Math.floor((diff % 3600000) / 60000), 'mins');
    setVal('cd-secs',  Math.floor((diff % 60000) / 1000), 'secs');
  }
  update();
  setInterval(update, 1000);
})();

// ---- Sommaire accordéon (livre-blanc) ----
function toggleSummary(item) {
  // Si déjà ouvert, on ferme. Sinon on ferme tous les autres et on ouvre celui-ci.
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.lb-summary-item').forEach(function(it) {
    it.classList.remove('open');
  });
  if (!wasOpen) item.classList.add('open');
}

// ---- Livre blanc form (Make webhook) ----
(function() {
  var form = document.getElementById('lbForm');
  if (!form) return;

  // MAKE WEBHOOK URL — endpoint du scenario Make qui dispatche vers Google Sheets + Brevo
  var MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/4p2eb716kpqr4yhqz1vt27g1ggkk4bsl';

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn.textContent;
    btn.textContent = 'Envoi en cours\u2026';
    btn.disabled = true;

    var data = {
      nom: form.nom.value.trim(),
      prenom: form.prenom.value.trim(),
      email: form.email.value.trim(),
      secteur: form.secteur.value,
      statut: form.statut.value,
      date: new Date().toISOString()
    };

    if (MAKE_WEBHOOK_URL === 'VOTRE_URL_WEBHOOK_MAKE') {
      // Demo mode — no webhook configured yet
      showSuccess();
      return;
    }

    fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function() { showSuccess(); })
    .catch(function() {
      btn.textContent = originalText;
      btn.disabled = false;
      alert('Une erreur est survenue. Veuillez r\u00e9essayer.');
    });

    function showSuccess() {
      form.innerHTML = '<div style="text-align:center;padding:32px 0"><p style="font-size:20px;font-weight:600;color:var(--vert-profond);margin-bottom:8px">Merci ' + data.prenom + ' !</p><p style="font-size:15px;color:var(--vert-legende)">Vous recevrez le livre blanc d\u00e8s sa sortie le 31 mai 2026.</p></div>';
    }
  });
})();


// ============================================
// CURSEUR CUSTOM — disque émeraude qui suit la souris (Apple Vision style)
// ============================================
(function() {
  // Désactiver sur tactile / petit écran
  if (window.matchMedia('(hover: none)').matches || window.innerWidth < 769) return;

  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.body.classList.add('cursor-active');

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;

  window.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
  });

  // Le ring suit avec un léger lag (lerp)
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  }
  loop();

  // Hover sur éléments cliquables
  var hoverSelector = 'a, button, .project-card, .featured-card, .skill-card, .stat-card, .filter-btn, .theme-toggle, [onclick], input, textarea, select, label';
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(hoverSelector)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(hoverSelector)) document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mousedown', function() { document.body.classList.add('cursor-down'); });
  document.addEventListener('mouseup', function() { document.body.classList.remove('cursor-down'); });

  // Cacher quand la souris quitte la fenêtre
  document.addEventListener('mouseleave', function() {
    dot.style.opacity = '0'; ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function() {
    dot.style.opacity = ''; ring.style.opacity = '';
  });
})();

// ============================================
// HERO PARALLAX — la photo bouge subtilement au scroll
// ============================================
(function() {
  var photo = document.querySelector('.hero .photo-placeholder');
  if (!photo) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ticking = false;
  function update() {
    var sy = window.scrollY;
    if (sy > 800) { ticking = false; return; }
    var translate = sy * -0.18;
    photo.style.transform = 'translate3d(0,' + translate + 'px,0)';
    ticking = false;
  }
  window.addEventListener('scroll', function() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();
