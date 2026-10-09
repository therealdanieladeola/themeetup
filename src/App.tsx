import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { CmsAdmin, CmsPageRenderer, fallbackBundle, getCmsBundle, type CmsBundle } from './cms';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  HeartHandshake,
  Menu,
  Instagram,
  MessageCircle,
  Mail,
  Quote,
  Sparkles,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import { LocationsPage, NewsletterSignup, PartnersPage, StoriesPage, VolunteerPage } from './extended';

const images = [
  '/resources/event-image-01.jpg',
  '/resources/event-image-02.jpg',
  '/resources/event-image-03.jpg',
  '/resources/event-image-04.jpg',
  '/resources/event-image-05.jpg',
  '/resources/event-image-06.jpg',
];

const navItems = [
  ['home', 'Home'],
  ['about', 'About'],
  ['experience', 'Experience'],
  ['events', 'Events'],
  ['community', 'Community'],
  ['stories', 'Stories'],
  ['locations', 'Locations'],
  ['gallery', 'Gallery'],
];

const experiences = [
  {
    icon: MessageCircle,
    title: 'Conversations',
    text: 'Honest conversations, fresh perspectives and space to be fully yourself.',
  },
  {
    icon: Sparkles,
    title: 'Games & fun',
    text: 'Low-pressure activities that make it easy to laugh, relax and connect.',
  },
  {
    icon: Utensils,
    title: 'Shared tables',
    text: 'Food, potluck moments and the kind of conversations that happen around a table.',
  },
  {
    icon: Users,
    title: 'Real connection',
    text: 'Meet people, build friendships and leave with names you actually remember.',
  },
];

const testimonials = [
  {
    quote: 'I came expecting an event. I left feeling like I had found people.',
    name: 'A Tribe Member',
    detail: 'The Meet Up',
  },
  {
    quote:
      'It is faith in everyday life. No pressure, just genuine people and meaningful moments.',
    name: 'A Tribe Member',
    detail: 'The Meet Up',
  },
  {
    quote:
      'The easiest place I have found to make new friends and still be completely myself.',
    name: 'A Tribe Member',
    detail: 'The Meet Up',
  },
];

function navigateTo(route: string) {
  window.location.hash = route;
}

function normalizeUrl(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\/wa\.me\//i.test(raw)) return raw.replace(/^http:/i, 'https:').replace(/wa\.me\/\+/, 'wa.me/');
  if (raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function openConfiguredUrl(value: unknown, fallbackRoute = 'join') {
  const url = normalizeUrl(value);
  if (!url) { navigateTo(fallbackRoute); return; }
  if (url.startsWith('#')) { navigateTo(url.slice(1)); return; }
  window.location.href = url;
}

function useRoute() {
  const getRoute = () => window.location.hash.replace('#', '') || 'home';
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const handleHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  return route;
}

function App() {
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [cms, setCms] = useState<CmsBundle | null>(null);

  const loadCms = () => getCmsBundle().then(setCms);
  useEffect(() => { loadCms(); }, []);
  useEffect(() => { const handleFocus = () => loadCms(); window.addEventListener('focus', handleFocus); return () => window.removeEventListener('focus', handleFocus); }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [route]);

  useEffect(() => {
    const settings = cms?.settings;
    const currentPage = cms?.pages.find(item => item.slug === route);
    if (settings || currentPage) {
      const title = currentPage?.seoTitle || settings?.seoTitle || 'The Meet Up — Christ. Culture. Connection.';
      const description = currentPage?.seoDescription || settings?.seoDescription || 'A lifestyle community for young Christians.';
      document.title = title;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = description;
    }
    if (!settings) return;
    document.documentElement.style.setProperty('--tm-primary', settings.primaryColor || '#a50005');
    document.documentElement.style.setProperty('--tm-cream', settings.secondaryColor || '#ffecaa');
    document.documentElement.style.setProperty('--tm-white', settings.accentColor || '#ffffff');
    document.documentElement.style.setProperty('--tm-black', settings.backgroundColor || '#111111');
  }, [cms]);

  useEffect(() => {
    if (lightbox === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', close);
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  const cmsPage = cms?.pages.find(item => item.slug === route);
  const galleryImages = cms?.collections.gallery?.map(item => item.image).filter(Boolean) || images;
  const page = useMemo(() => {
    if (route === 'admin') return <CmsAdmin />;
    if (route === 'join') return <JoinPage mode="tribe" settings={cms?.settings || null} joined={joined} onSubmitted={() => setJoined(true)} />;
    if (route === 'event-register') {
      const event = cms?.collections.event?.[0] || null;
      return <JoinPage mode="event" event={event} settings={cms?.settings || null} joined={joined} onSubmitted={() => setJoined(true)} />;
    }
    if (cmsPage && !['stories', 'locations', 'volunteer', 'partners'].includes(route)) return <CmsPageRenderer page={cmsPage} bundle={cms || fallbackBundle} onOpenGallery={setLightbox} />;
    if (route === 'stories') return <StoriesPage page={cmsPage} stories={cms?.collections.story || []} />;
    if (route === 'locations') return <LocationsPage page={cmsPage} locations={cms?.collections.location || []} />;
    if (route === 'volunteer') return <VolunteerPage page={cmsPage} />;
    if (route === 'partners') return <PartnersPage page={cmsPage} />;
    if (route === 'about') return <AboutPage />;
    if (route === 'experience') return <ExperiencePage />;
    if (route === 'events') return <EventsPage />;
    if (route === 'community') return <CommunityPage />;
    if (route === 'gallery') return <GalleryPage onOpen={setLightbox} />;
    return <HomePage onOpenGallery={() => navigateTo('gallery')} />;
  }, [route, joined, cmsPage, cms]);

  if (route === 'admin') return <CmsAdmin />;

  return (
    <div className="site-shell">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigateTo('home')}
          aria-label="The Meet Up home"
        >
          <img
            src={cms?.settings?.logo || '/resources/the-meet-up-logo.png'}
            alt={cms?.settings?.brandName || 'The Meet Up'}
            width="68"
            height="54"
          />
        </button>
        <nav
          className={`desktop-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Primary navigation"
        >
          {navItems.map(([href, label]) => (
            <button
              key={href}
              className={route === href ? 'active' : ''}
              onClick={() => navigateTo(href)}
            >
              {label}
            </button>
          ))}
          <button className="nav-cta" onClick={() => openConfiguredUrl(cms?.settings?.joinUrl, 'join')}>
            Join The Tribe <ArrowUpRight size={16} />
          </button>
        </nav>
        <button
          className="menu-button"
          onClick={() => setMenuOpen(open => !open)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-nav">
          {navItems.map(([href, label]) => (
            <button key={href} onClick={() => navigateTo(href)}>
              {label}
            </button>
          ))}
          <button className="nav-cta" onClick={() => openConfiguredUrl(cms?.settings?.joinUrl, 'join')}>
            Join The Tribe <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      <main key={route} className="page-transition">
        {page}
      </main>

      <footer className="footer">
        <div className="footer-top">
          <div>
            <p className="eyebrow light">The Meet Up</p>
            <h2>
              Find your people.
              <br />
              Keep your faith.
            </h2>
          </div>
          <div className="footer-links">
            {navItems.slice(1).map(([href, label]) => (
              <button key={href} onClick={() => navigateTo(href)}>
                {label}
              </button>
            ))}
            <button onClick={() => openConfiguredUrl(cms?.settings?.joinUrl, 'join')}>Join The Tribe</button>
            <button onClick={() => navigateTo('volunteer')}>Volunteer</button>
            <button onClick={() => navigateTo('partners')}>Partnerships & Sponsorship</button>
            {cms?.settings?.instagramUrl && <a href={normalizeUrl(cms.settings.instagramUrl)} target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a>}
            {cms?.settings?.whatsappUrl && <a href={normalizeUrl(cms.settings.whatsappUrl)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
            {cms?.settings?.tiktokUrl && <a href={normalizeUrl(cms.settings.tiktokUrl)} target="_blank" rel="noreferrer">TikTok</a>}
            {cms?.settings?.emailUrl && <a href={normalizeUrl(cms.settings.emailUrl)}><Mail size={16} /> Email</a>}
          </div>
        </div>
        <div className="footer-newsletter container">
          <NewsletterSignup />
        </div>
        <div className="footer-bottom">
          <span>Christ. Culture. Connection.</span>
          <span>Built for real community.</span>
        </div>
      </footer>

      {lightbox !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
          onClick={() => setLightbox(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Close image"
          >
            <X />
          </button>
          <img
            src={galleryImages[lightbox] || images[lightbox]}
            alt="The Meet Up community moment"
            onClick={event => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <section className="page-intro section">
      <div className="container narrow">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{text}</p>
      </div>
    </section>
  );
}

function HomePage({ onOpenGallery }: { onOpenGallery: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-media">
          <img
            src={images[2]}
            alt="Young people enjoying The Meet Up together"
            fetchPriority="high"
          />
        </div>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="eyebrow light">
            A lifestyle community for young Christians
          </p>
          <h1>
            Christ.
            <br />
            <span>Culture.</span>
            <br />
            Connection.
          </h1>
          <p className="hero-copy">
            A place to find your people, enjoy life, ask real questions and keep
            your faith at the centre.
          </p>
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => navigateTo('join')}
            >
              Join The Tribe <ArrowUpRight />
            </button>
            <button
              className="button ghost"
              onClick={() => navigateTo('experience')}
            >
              See the experience <ChevronRight />
            </button>
          </div>
        </div>
        <div className="hero-stamp">
          Real people. Real moments.
          <br />
          Faith in everyday life.
        </div>
      </section>

      <section className="section intro-section">
        <div className="container split">
          <div>
            <p className="eyebrow">What is The Meet Up?</p>
            <h2>
              Faith feels different when you have people to share life with.
            </h2>
          </div>
          <div>
            <p className="body-large">
              The Meet Up is a Christian lifestyle community built around
              friendship, belonging and experiences that feel natural. We create
              room for young Christians to connect beyond the usual settings,
              build meaningful relationships and grow in faith while enjoying
              life together.
            </p>
            <button className="text-link" onClick={() => navigateTo('about')}>
              Learn more about us <ArrowUpRight />
            </button>
          </div>
        </div>
      </section>

      <section className="section cream-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The Experience</p>
              <h2>
                Come as you are.
                <br />
                Leave more connected.
              </h2>
            </div>
            <p>
              Every Meet Up is designed to make connection easy, memorable and
              real.
            </p>
          </div>
          <div className="experience-grid">
            {experiences.map(({ icon: Icon, title, text }) => (
              <article className="experience-card" key={title}>
                <div className="icon-wrap">
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section moments-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Real Moments</p>
              <h2>Not staged. Just us.</h2>
            </div>
            <button className="text-link" onClick={onOpenGallery}>
              View the gallery <ArrowUpRight />
            </button>
          </div>
          <div className="moment-grid">
            {images.slice(0, 5).map((image, index) => (
              <button
                className={`moment-card moment-${index + 1}`}
                key={image}
                onClick={onOpenGallery}
              >
                <img
                  src={image}
                  alt="Community moment from The Meet Up"
                  loading="lazy"
                  decoding="async"
                />
                <span>View moment</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section quote-section">
        <div className="container quote-inner">
          <Quote className="quote-icon" />
          <div>
            <p className="eyebrow light">From the Tribe</p>
            <blockquote>
              “I came expecting an event. I left feeling like I had found
              people.”
            </blockquote>
            <p className="quote-credit">A Meet Up member</p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About The Meet Up"
        title="Community before performance."
        text="We are building a place where Christian young adults can form genuine friendships, enjoy shared experiences and let faith become part of everyday life."
      />
      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">Why we exist</p>
            <h2>Because belonging should not be complicated.</h2>
          </div>
          <div>
            <p className="body-large">
              Loneliness can exist even when you are surrounded by people. The
              Meet Up creates intentional spaces for people to move from
              familiar faces to real friendships.
            </p>
            <p className="body-large">
              Our vision is simple: a growing community where faith, friendship
              and culture can live in the same room without feeling forced.
            </p>
          </div>
        </div>
      </section>
      <section className="section dark-section">
        <div className="container three-columns">
          <div>
            <p className="eyebrow light">Our vision</p>
            <h3>A generation that knows it belongs.</h3>
            <p>
              We want people to experience Christian community as warm, honest,
              relevant and deeply human.
            </p>
          </div>
          <div>
            <p className="eyebrow light">Our mission</p>
            <h3>Create room for connection.</h3>
            <p>
              We curate experiences that help people meet, talk, laugh, eat,
              learn and build relationships that continue after the event.
            </p>
          </div>
          <div>
            <p className="eyebrow light">Our rhythm</p>
            <h3>Gather. Connect. Grow.</h3>
            <p>Events are the doorway. Community is the destination.</p>
          </div>
        </div>
      </section>
      <section className="section image-story">
        <div className="container story-grid">
          <img
            src={images[4]}
            alt="Friends sitting together at a picnic"
            loading="lazy"
          />
          <div>
            <p className="eyebrow">The heart of it</p>
            <h2>Less pressure. More presence.</h2>
            <p className="body-large">
              You do not need to arrive with a perfect story, a big personality
              or a ready-made friend group. The Meet Up is designed to help you
              show up, settle in and find your place.
            </p>
            <button className="button dark" onClick={() => navigateTo('join')}>
              Find your people <ArrowUpRight />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function ExperiencePage() {
  return (
    <>
      <PageIntro
        eyebrow="The Experience"
        title="An easy way to meet people in real life."
        text="Think good conversations, games, food, music, laughter and enough breathing room for genuine friendships to happen."
      />
      <section className="section timeline-section">
        <div className="container">
          {[
            [
              '01',
              'Arrive & settle in',
              'Come in, find a familiar face or make a new one. We keep the first few minutes simple and welcoming.',
              images[0],
            ],
            [
              '02',
              'Break the ice',
              'Games and light activities take the pressure off and get everyone moving beyond small talk.',
              images[1],
            ],
            [
              '03',
              'Talk about what matters',
              'From culture to purpose, faith to relationships, we make room for conversations that go somewhere.',
              images[3],
            ],
            [
              '04',
              'Eat, laugh & linger',
              'Shared food creates the kind of unhurried space where connection has time to stick.',
              images[4],
            ],
          ].map(([number, title, text, image]) => (
            <article className="timeline-item" key={number}>
              <div className="timeline-number">{number}</div>
              <div className="timeline-copy">
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
              <img src={image} alt={title} loading="lazy" />
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function EventsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Events"
        title="Come for the moment. Stay for the people."
        text="Monthly meetups built around relaxed experiences, shared food and the kind of community you can actually feel."
      />
      <section className="section event-feature">
        <div className="container event-card">
          <div className="event-image">
            <img
              src={images[4]}
              alt="The Meet Up Potluck Picnic"
              loading="lazy"
            />
          </div>
          <div className="event-copy">
            <p className="eyebrow">Featured event</p>
            <h2>Potluck Picnic</h2>
            <p className="body-large">
              Bring something to share, bring your appetite and bring your real
              self. The Potluck Picnic is an afternoon of food, games,
              conversations and open-air connection.
            </p>
            <div className="event-meta">
              <span>
                <CalendarDays /> Monthly gathering
              </span>
              <span>
                <Utensils /> Shared meal
              </span>
              <span>
                <Users /> Open community
              </span>
            </div>
            <button
              className="button primary"
              onClick={() => navigateTo('join')}
            >
              Register for Next Event <ArrowUpRight />
            </button>
          </div>
        </div>
      </section>
      <section className="section cream-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">What to expect</p>
              <h2>
                Simple structure.
                <br />
                Plenty of room for you.
              </h2>
            </div>
          </div>
          <div className="expect-grid">
            <div>
              <strong>01</strong>
              <h3>Welcome</h3>
              <p>Meet the hosts, settle in and get comfortable.</p>
            </div>
            <div>
              <strong>02</strong>
              <h3>Connect</h3>
              <p>Games and guided prompts make introductions easy.</p>
            </div>
            <div>
              <strong>03</strong>
              <h3>Share</h3>
              <p>Eat together and let conversations happen naturally.</p>
            </div>
            <div>
              <strong>04</strong>
              <h3>Keep in touch</h3>
              <p>
                Leave with people you can actually continue the journey with.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CommunityPage() {
  const people = [
    { role: 'Creators', image: images[1] },
    { role: 'Builders', image: images[2] },
    { role: 'Leaders', image: images[3] },
    { role: 'Dreamers', image: images[5] },
  ];
  return (
    <>
      <PageIntro
        eyebrow="Community"
        title="Different stories. One Tribe."
        text="The Meet Up is for young Christians with different personalities, backgrounds, interests and dreams who want a place to belong."
      />
      <section className="section">
        <div className="container">
          <div className="community-intro">
            <HeartHandshake />
            <div>
              <p className="eyebrow">Meet the Tribe</p>
              <h2>Come for the event. Find a community.</h2>
              <p className="body-large">
                There is no single way to be a member here. Some people come to
                make friends. Some come to find people who understand their
                season. Some come because they simply want a good day out with
                good people. All are welcome to show up as they are.
              </p>
            </div>
          </div>
          <div className="people-grid">
            {people.map(person => (
              <article className="person-card" key={person.role}>
                <img
                  src={person.image}
                  alt={`The Meet Up ${person.role}`}
                  loading="lazy"
                />
                <div>
                  <span>{person.role}</span>
                  <h3>People with something to bring.</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function GalleryPage({ onOpen }: { onOpen: (index: number) => void }) {
  return (
    <>
      <PageIntro
        eyebrow="Gallery"
        title="The kind of moments you remember."
        text="A look at the laughter, conversations, shared tables and friendships that make The Meet Up what it is."
      />
      <section className="section">
        <div className="container gallery-grid">
          {images.map((image, index) => (
            <button
              className={`gallery-item gallery-${index + 1}`}
              key={image}
              onClick={() => onOpen(index)}
            >
              <img                  src={image}
                  alt="The Meet Up event moment"
                  loading="lazy"
                  decoding="async" />
              <span>Open image</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function JoinPage({
  mode,
  event,
  settings,
  joined,
  onSubmitted,
}: {
  mode: 'tribe' | 'event';
  event?: Record<string, any> | null;
  settings: Record<string, any> | null;
  joined: boolean;
  onSubmitted: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', city: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const title = mode === 'event' ? `Register for ${event?.title || 'the next event'}` : 'Join The Tribe';
  const whatsappUrl = mode === 'event' ? (event?.eventWhatsAppUrl || event?.whatsappUrl || settings?.whatsappUrl || '') : (settings?.whatsappUrl || '');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!form.name.trim() || !form.email.trim() || !form.whatsapp.trim() || !form.city.trim()) {
      setErrorMessage('Please complete your name, email, WhatsApp number and city.');
      return;
    }
    if (mode === 'event' && !event?.slug) {
      setErrorMessage('This event is not available for registration yet.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/registrations', {
        kind: mode,
        eventSlug: mode === 'event' ? event?.slug : '',
        eventTitle: mode === 'event' ? event?.title : '',
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        city: form.city,
        reason: form.reason,
      });
      onSubmitted();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'We could not submit your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="join-page section">
      <div className="container join-layout">
        <div className="join-copy">
          <p className="eyebrow light">{mode === 'event' ? 'Event registration' : 'Join The Tribe'}</p>
          <h1>{mode === 'event' ? 'Come for the moment.' : 'Find your people.'}<br /><span>{mode === 'event' ? 'Stay for the people.' : 'Keep your faith.'}</span></h1>
          <p>{mode === 'event' ? `Reserve your place for ${event?.title || 'our next Meet Up'}.` : 'Ready for community that feels like real life? Tell us a little about yourself and take the next step.'}</p>
          <div className="join-points"><span><Check /> Come as you are</span><span><Check /> Real relationships</span><span><Check /> Faith at the centre</span></div>
        </div>
        <div className="join-card">
          {joined ? (
            <div className="success-state">
              <div className="success-icon"><Check /></div>
              <p className="eyebrow">Registration received</p>
              <h2>{mode === 'event' ? 'You are registered.' : 'You are in.'}</h2>
              <p>{mode === 'event' ? `Thanks for registering for ${event?.title || 'the event'}.` : 'Thanks for reaching out. We have your details and can now connect you with the Tribe.'}</p>
              {whatsappUrl ? <a className="button primary" href={normalizeUrl(whatsappUrl)} target="_blank" rel="noreferrer">Join WhatsApp <MessageCircle /></a> : <button className="button primary" onClick={() => navigateTo(mode === 'event' ? 'events' : 'home')}>{mode === 'event' ? 'Back to Events' : 'Explore The Meet Up'} <ArrowUpRight /></button>}
            </div>
          ) : (
            <form onSubmit={submit}>
              <p className="form-title">{title}</p>
              {errorMessage && <div className="cms-message" role="alert">{errorMessage}</div>}
              <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required /></label>
              <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></label>
              <label>WhatsApp number<input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="e.g. +229 90 00 00 00" required /></label>
              <label>City<input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Where are you based?" required /></label>
              <label>{mode === 'event' ? 'Anything we should know?' : 'What brings you here?'}<textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Tell us a little more." rows={4} /></label>
              <button className="button primary full" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : mode === 'event' ? 'Register for Event' : 'Join The Tribe'} <ArrowUpRight /></button>
              <p className="form-note">Your details are used only to help you connect with The Meet Up.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ settings }: { settings?: Record<string, any> | null }) {
  return (
    <section className="cta-band">
      <div className="container cta-inner">
        <div>
          <p className="eyebrow light">Your next chapter could start here.</p>
          <h2>Come meet your people.</h2>
        </div>
        <button className="button cream" onClick={() => openConfiguredUrl(settings?.joinUrl, 'join')}>
          Join The Tribe <ArrowUpRight />
        </button>
      </div>
    </section>
  );
}

export default App;
