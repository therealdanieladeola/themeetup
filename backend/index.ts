import { db, requireAuth, requireAdminEmailAllowlist, router, json, error, storage } from '@appdeploy/sdk';

const TABLE = 'cms_documents';
const REVISION_TABLE = 'cms_revisions';
const MEDIA_PREFIX = 'cms-media/';
const REGISTRATION_TABLE = 'community_registrations';
const NEWSLETTER_TABLE = 'newsletter_subscribers';
const INQUIRY_TABLE = 'community_inquiries';
const REGISTRATION_TYPES = ['tribe', 'event'];
const ADMIN_EMAILS = ['therealdanieladeola@gmail.com'];

interface CmsDoc {
  id?: string;
  type: string;
  slug: string;
  status: 'draft' | 'published';
  draft: Record<string, any>;
  published?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const now = () => new Date().toISOString();

const seedDocs = (): Array<Omit<CmsDoc, 'id'>> => {
  const stamp = now();
  const page = (slug: string, navLabel: string, title: string, eyebrow: string, subtitle: string, heroImage: string, bodyMarkdown: string) => ({
    type: 'page', slug, status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp,
    draft: { slug, navLabel, title, eyebrow, subtitle, heroImage, bodyMarkdown, themeColor: '#a50005', accentColor: '#ffecaa', seoTitle: title + ' | The Meet Up', seoDescription: subtitle },
    published: { slug, navLabel, title, eyebrow, subtitle, heroImage, bodyMarkdown, themeColor: '#a50005', accentColor: '#ffecaa', seoTitle: title + ' | The Meet Up', seoDescription: subtitle },
  });
  const basePages = [
    page('home', 'Home', 'Christ. Culture. Connection.', 'A lifestyle community for young Christians', 'Find your people. Keep your faith.', '/resources/event-image-03.jpg', '## What is The Meet Up?\n\nThe Meet Up is a Christian lifestyle community built around friendship, belonging and experiences that feel natural.\n\n## Come as you are. Leave more connected.\n\nConversations, games, shared tables and real connection moments make every gathering feel like life with people you actually know.'),
    page('about', 'About', 'Community before performance.', 'About The Meet Up', 'We are building a place where Christian young adults can form genuine friendships, enjoy shared experiences and let faith become part of everyday life.', '/resources/event-image-05.jpg', '## Why we exist\n\nBecause belonging should not be complicated. The Meet Up creates intentional spaces for people to move from familiar faces to real friendships.\n\n## Our vision\n\nA generation that knows it belongs.'),
    page('experience', 'Experience', 'An easy way to meet people in real life.', 'The Experience', 'Good conversations, games, food, music, laughter and enough breathing room for genuine friendships to happen.', '/resources/event-image-02.jpg', '## Arrive\n\nSettle in and find a familiar face.\n\n## Connect\n\nGames and prompts make introductions easy.\n\n## Grow\n\nMake room for conversations that go somewhere.'),
    page('events', 'Events', 'Come for the moment. Stay for the people.', 'Events', 'Meetups built around relaxed experiences, shared food and community you can actually feel.', '/resources/event-image-05.jpg', '## Events 2.0\n\nBrowse upcoming gatherings, register online and keep the conversation going on WhatsApp.'),
    page('community', 'Community', 'Different stories. One Tribe.', 'Community', 'Different personalities, backgrounds, interests and dreams can all belong here.', '/resources/event-image-03.jpg', '## Meet the Tribe\n\nAll are welcome to show up as they are.'),
    page('gallery', 'Gallery', 'The kind of moments you remember.', 'Gallery', 'A look at the laughter, conversations, shared tables and friendships that make The Meet Up what it is.', '/resources/event-image-04.jpg', '## Real moments\n\nNot staged. Just us.'),
    page('join', 'Join The Tribe', 'Find your people. Keep your faith.', 'Join The Tribe', 'Ready for community that feels like real life? Take the next step.', '/resources/event-image-06.jpg', '## You belong here\n\nCome as you are. Bring your questions, your story and your appetite for meaningful connection.'),
    page('stories', 'Stories', 'Stories from the Tribe.', 'Stories / Journal', 'Ideas, reflections and real moments from The Meet Up community.', '/resources/event-image-01.jpg', '## The Journal\n\nStories that make community feel human.'),
    page('locations', 'Locations', 'Find The Meet Up near you.', 'Community Locations', 'A multi-city community structure designed to grow with the Tribe.', '/resources/event-image-02.jpg', '## Chapters\n\nEach city can have its own hosts, events and community rhythm while staying connected to The Meet Up.'),
    page('volunteer', 'Volunteer', 'Help build the community.', 'Volunteer', 'Bring your skills, energy and heart to the work behind the gatherings.', '/resources/event-image-06.jpg', '## Serve with us\n\nTell us where you would love to contribute.'),
    page('partners', 'Partners', 'Build with The Meet Up.', 'Partnerships & Sponsorship', 'Partner with a growing Christian lifestyle community through meaningful collaborations and sponsorship.', '/resources/event-image-04.jpg', '## Partnerships\n\nLet us build useful, human and lasting collaborations together.'),
  ];
  const settings = { brandName: 'The Meet Up', tagline: 'Christ. Culture. Connection.', primaryColor: '#a50005', secondaryColor: '#ffecaa', accentColor: '#ffffff', backgroundColor: '#a50005', logo: '/resources/the-meet-up-logo.png', whatsappUrl: '', instagramUrl: '', tiktokUrl: 'https://www.tiktok.com/@themeetupcommunity', emailUrl: 'mailto:therealdanieladeola@gmail.com', joinUrl: '#join', seoTitle: 'The Meet Up — Christ. Culture. Connection.', seoDescription: 'A lifestyle community for young Christians.' };
  return [
    ...basePages,
    { type: 'settings', slug: 'site', status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: settings, published: settings },
    ...[['Conversations', 'Honest conversations, fresh perspectives and space to be fully yourself.'], ['Games & fun', 'Low-pressure activities that make it easy to laugh, relax and connect.'], ['Shared tables', 'Food, potluck moments and the kind of conversations that happen around a table.'], ['Real connection', 'Meet people, build friendships and leave with names you actually remember.']].map(([title, description], i) => ({ type: 'experience', slug: `experience-${i + 1}`, status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { title, description, sortOrder: i + 1 }, published: { title, description, sortOrder: i + 1 } })),
    ...[['I came expecting an event. I left feeling like I had found people.', 'A Tribe Member'], ['It is faith in everyday life. No pressure, just genuine people and meaningful moments.', 'A Tribe Member'], ['The easiest place I have found to make new friends and still be completely myself.', 'A Tribe Member']].map(([quote, name], i) => ({ type: 'testimonial', slug: `testimonial-${i + 1}`, status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { quote, name, detail: 'The Meet Up', sortOrder: i + 1 }, published: { quote, name, detail: 'The Meet Up', sortOrder: i + 1 } })),
    ...['01','02','03','04','05','06'].map((n, i) => ({ type: 'gallery', slug: `gallery-${n}`, status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { title: `The Meet Up moment ${n}`, image: `/resources/event-image-${n}.jpg`, alt: 'The Meet Up community moment', caption: '', sortOrder: i + 1 }, published: { title: `The Meet Up moment ${n}`, image: `/resources/event-image-${n}.jpg`, alt: 'The Meet Up community moment', caption: '', sortOrder: i + 1 } })),
    ...[['Creators', 'People with something to bring.', '/resources/event-image-02.jpg'], ['Builders', 'People with something to bring.', '/resources/event-image-03.jpg'], ['Leaders', 'People with something to bring.', '/resources/event-image-04.jpg'], ['Dreamers', 'People with something to bring.', '/resources/event-image-06.jpg']].map(([role, title, image], i) => ({ type: 'community', slug: `community-${i + 1}`, status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { role, title, image, description: '', sortOrder: i + 1 }, published: { role, title, image, description: '', sortOrder: i + 1 } })),
    { type: 'event', slug: 'potluck-picnic', status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { title: 'Potluck Picnic', eyebrow: 'Featured event', description: 'Bring something to share, bring your appetite and bring your real self. An afternoon of food, games, conversations and open-air connection.', image: '/resources/event-image-05.jpg', dateLabel: 'Monthly gathering', timeLabel: 'Afternoon', venue: 'Community venue', city: 'Benin Republic', mealLabel: 'Shared meal', audienceLabel: 'Open community', capacity: '100', registrationOpen: true, featured: true, ctaLabel: 'Register for Next Event', ctaUrl: '#event-register', eventWhatsAppUrl: '', whatToExpectMarkdown: '## What to expect\n\nWelcome. Connect. Share. Keep in touch.' }, published: { title: 'Potluck Picnic', eyebrow: 'Featured event', description: 'Bring something to share, bring your appetite and bring your real self. An afternoon of food, games, conversations and open-air connection.', image: '/resources/event-image-05.jpg', dateLabel: 'Monthly gathering', timeLabel: 'Afternoon', venue: 'Community venue', city: 'Benin Republic', mealLabel: 'Shared meal', audienceLabel: 'Open community', capacity: '100', registrationOpen: true, featured: true, ctaLabel: 'Register for Next Event', ctaUrl: '#event-register', eventWhatsAppUrl: '', whatToExpectMarkdown: '## What to expect\n\nWelcome. Connect. Share. Keep in touch.' } },
    { type: 'story', slug: 'welcome-to-the-journal', status: 'published' as const, createdAt: stamp, updatedAt: stamp, publishedAt: stamp, draft: { title: 'Welcome to The Journal', excerpt: 'A space for stories, reflections and ideas from the Tribe.', image: '/resources/event-image-01.jpg', category: 'Community', author: 'The Meet Up', dateLabel: 'From the Tribe', bodyMarkdown: '## Why we are here\n\nCommunity becomes more meaningful when we share the stories behind it. This journal is a place for reflections, practical ideas and honest moments.' }, published: { title: 'Welcome to The Journal', excerpt: 'A space for stories, reflections and ideas from the Tribe.', image: '/resources/event-image-01.jpg', category: 'Community', author: 'The Meet Up', dateLabel: 'From the Tribe', bodyMarkdown: '## Why we are here\n\nCommunity becomes more meaningful when we share the stories behind it. This journal is a place for reflections, practical ideas and honest moments.' } },
  ];
};

async function ensureSeeded() { const { items } = await db.list<CmsDoc>(TABLE, { limit: 500 }); const seeds = seedDocs(); const migrations = await db.list<any>('cms_migrations', { limit: 50 }); const initialSeed = migrations.items.find(item => item.key === 'initial-cms-seed-v3'); if (!initialSeed) { if (!items.length) await db.add(TABLE, seeds); await db.add('cms_migrations', [{ key: 'initial-cms-seed-v3', completedAt: now() }]); }
  const current = await db.list<CmsDoc>(TABLE, { limit: 500 });
  const latestMigrations = await db.list<any>('cms_migrations', { limit: 50 });
  const legacyLocationCleanup = latestMigrations.items.find(item => item.key === 'remove-unintended-locations-v1');
  if (!legacyLocationCleanup) {
    const unwanted = current.items.filter(item => item.type === 'location' && (item.slug === 'benin-republic' || item.slug === 'nigeria')).map(item => item.id);
    if (unwanted.length) await db.delete(TABLE, unwanted);
    await db.add('cms_migrations', [{ key: 'remove-unintended-locations-v1', completedAt: now() }]);
  }
  const canonicalMigration = latestMigrations.items.find(item => item.key === 'canonicalize-cms-records-v2');
  if (!canonicalMigration) {
    const refreshed = await db.list<CmsDoc>(TABLE, { limit: 500 });
    const groups = new Map<string, CmsDoc[]>();
    for (const doc of refreshed.items) { const key = `${doc.type}:${doc.slug}`; const group = groups.get(key) || []; group.push(doc); groups.set(key, group); }
    const duplicateIds = Array.from(groups.values()).filter(group => group.length > 1).flatMap(group => { group.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()); return group.slice(1).map(doc => doc.id).filter(Boolean) as string[]; });
    if (duplicateIds.length) await db.delete(TABLE, duplicateIds);
    await db.add('cms_migrations', [{ key: 'canonicalize-cms-records-v2', completedAt: now() }]);
  }
  const settings = (await db.list<CmsDoc>(TABLE, { limit: 500 })).items.find(item => item.type === 'settings' && item.slug === 'site'); if (settings && !settings.draft.emailUrl) { const next = { ...settings, draft: { ...settings.draft, emailUrl: 'mailto:therealdanieladeola@gmail.com' }, published: settings.published ? { ...settings.published, emailUrl: settings.published.emailUrl || 'mailto:therealdanieladeola@gmail.com' } : settings.published, updatedAt: now() }; await db.update(TABLE, [{ id: settings.id, record: next }]); } }
async function listDocs() { const { items } = await db.list<CmsDoc>(TABLE, { limit: 500 }); return items; }
const MEDIA_FIELDS = ['logo', 'heroImage', 'image'];

function extractMediaPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith(MEDIA_PREFIX)) return value;
  try {
    const parsed = new URL(value);
    const queryPath = parsed.searchParams.get('path');
    if (queryPath?.startsWith(MEDIA_PREFIX)) return queryPath;
    const decodedPath = decodeURIComponent(parsed.pathname);
    const marker = decodedPath.indexOf(MEDIA_PREFIX);
    if (marker >= 0) return decodedPath.slice(marker).split(/[?#]/)[0];
  } catch { return null; }
  return null;
}

async function resolveMediaValue(value: unknown): Promise<unknown> {
  const directPath = extractMediaPath(value);
  if (!directPath) return value;
  const [{ url }] = await storage.url([directPath]);
  return url || value;
}

function normalizeEventLinks(doc: CmsDoc): CmsDoc {
  if (doc.type !== 'event') return doc;
  return { ...doc, draft: { ...doc.draft, eventWhatsAppUrl: doc.draft.eventWhatsAppUrl ?? '' }, published: doc.published ? { ...doc.published, eventWhatsAppUrl: doc.published.eventWhatsAppUrl ?? '' } : doc.published };
}

async function hydrateMedia(record: Record<string, unknown> | null | undefined) {
  if (!record) return record;
  const next = { ...record };
  for (const field of MEDIA_FIELDS) if (field in next) next[field] = await resolveMediaValue(next[field]);
  return next;
}

async function publicBundle() {
  await ensureSeeded();
  const docs = await listDocs();
  const published = docs.filter(doc => doc.status === 'published' && doc.published);
  const settingsDoc = published.find(d => d.type === 'settings');
  const pageDocs = published.filter(d => d.type === 'page');
  const collectionTypes = ['experience', 'event', 'testimonial', 'gallery', 'community', 'story', 'location'];
  const settings = await hydrateMedia(settingsDoc?.published ?? null);
  const pages = await Promise.all(pageDocs.map(async d => ({ id: d.id, slug: d.slug, ...(await hydrateMedia(d.published)) })));
  const registrations = await db.list<any>(REGISTRATION_TABLE, { limit: 200 });
  const collections = Object.fromEntries(await Promise.all(collectionTypes.map(async type => [type, await Promise.all(published.filter(d => d.type === type).map(async d => {
    const item = await hydrateMedia(type === 'event' ? normalizeEventLinks(d).published : d.published);
    if (type === 'event') return { id: d.id, slug: d.slug, ...(item || {}), registrationCount: registrations.items.filter(r => r.eventSlug === d.slug && r.status !== 'cancelled').length };
    return { id: d.id, slug: d.slug, ...(item || {}) };
  }))])));
  return { settings, pages, collections };
}

const admin = [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS)];
async function saveRevision(doc: CmsDoc, actor: string) { try { if (doc.id) await db.add(REVISION_TABLE, [{ documentId: doc.id, actor, createdAt: now(), snapshot: doc.draft }]); } catch (revisionError) { console.warn('CMS revision write skipped:', revisionError); } }
function normalizeCmsSlug(value: unknown, fallback: string) { const slug = String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return slug || fallback; }
function locationDraft(value: Record<string, any>) { return { name: String(value.name ?? '').trim(), city: String(value.city ?? '').trim(), country: String(value.country ?? '').trim(), statusLabel: String(value.statusLabel ?? 'Coming soon').trim(), description: String(value.description ?? '').trim(), image: String(value.image ?? '').trim(), sortOrder: value.sortOrder === '' || value.sortOrder == null ? 0 : Number(value.sortOrder) || 0 }; }

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/content': [async () => json(await publicBundle())],
  'POST /api/registrations': [async ctx => { const body = ctx.body as any; if (!body.kind || !REGISTRATION_TYPES.includes(body.kind)) return error('Invalid registration type', 400); if (!body.name?.trim() || !body.email?.trim() || !body.whatsapp?.trim() || !body.city?.trim()) return error('Name, email, WhatsApp number and city are required', 400); if (!/^\S+@\S+\.\S+$/.test(body.email.trim())) return error('Please enter a valid email address', 400); if (body.kind === 'event' && !body.eventSlug) return error('Event selection is required', 400); const stamp = now(); const [id] = await db.add(REGISTRATION_TABLE, [{ kind: body.kind, eventSlug: body.eventSlug || '', eventTitle: body.eventTitle || '', name: body.name.trim(), email: body.email.trim().toLowerCase(), whatsapp: body.whatsapp.trim(), city: body.city.trim(), reason: (body.reason || '').trim(), status: 'new', notes: '', createdAt: stamp, updatedAt: stamp }]); return id ? json({ id, submitted: true }) : error('Unable to submit registration', 500); }],
  'POST /api/newsletter': [async ctx => { const body = ctx.body as any; if (!body.email?.trim() || !/^\S+@\S+\.\S+$/.test(body.email.trim())) return error('Please enter a valid email address', 400); const email = body.email.trim().toLowerCase(); const existing = await db.list<any>(NEWSLETTER_TABLE, { limit: 200 }); if (existing.items.some(item => item.email === email)) return json({ subscribed: true, alreadySubscribed: true }); const [id] = await db.add(NEWSLETTER_TABLE, [{ email, source: body.source || 'website', status: 'active', createdAt: now() }]); return id ? json({ subscribed: true }) : error('Unable to subscribe', 500); }],
  'POST /api/inquiries': [async ctx => { const body = ctx.body as any; const allowed = ['volunteer', 'partnership', 'sponsorship']; if (!allowed.includes(body.kind)) return error('Invalid enquiry type', 400); if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) return error('Name, email and message are required', 400); const [id] = await db.add(INQUIRY_TABLE, [{ kind: body.kind, name: body.name.trim(), email: body.email.trim().toLowerCase(), phone: (body.phone || '').trim(), organisation: (body.organisation || '').trim(), city: (body.city || '').trim(), message: body.message.trim(), status: 'new', createdAt: now(), updatedAt: now() }]); return id ? json({ submitted: true, id }) : error('Unable to submit enquiry', 500); }],
  'GET /api/admin/session': [...admin, async ctx => json({ ok: true, email: ctx.user?.email ?? null, name: ctx.user?.name ?? null })],
  'GET /api/admin/dashboard': [...admin, async () => { await ensureSeeded(); const docs = await listDocs(); const registrations = await db.list<any>(REGISTRATION_TABLE, { limit: 200 }); const inquiries = await db.list<any>(INQUIRY_TABLE, { limit: 200 }); const newsletter = await db.list<any>(NEWSLETTER_TABLE, { limit: 200 }); return json({ pages: docs.filter(d => d.type === 'page').length, published: docs.filter(d => d.status === 'published').length, events: docs.filter(d => d.type === 'event').length, stories: docs.filter(d => d.type === 'story').length, locations: docs.filter(d => d.type === 'location').length, registrations: registrations.items.length, newRegistrations: registrations.items.filter(r => r.status === 'new').length, enquiries: inquiries.items.length, newsletter: newsletter.items.length }); }],
  'GET /api/admin/documents': [...admin, async () => { await ensureSeeded(); return json({ documents: (await listDocs()).map(normalizeEventLinks) }); }],
  'POST /api/admin/documents': [...admin, async ctx => { const body = ctx.body as Partial<CmsDoc>; const type = String(body.type || '').trim(); const requestedSlug = normalizeCmsSlug(body.slug, `${type}-${Date.now()}`); if (!type || !body.draft || typeof body.draft !== 'object') return error('Content type and draft content are required', 400); const draft = type === 'location' ? locationDraft(body.draft) : body.draft; const matches = (await listDocs()).filter(doc => doc.type === type && doc.slug === requestedSlug); if (matches.length) { matches.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()); const canonical = matches[0]; const duplicateIds = matches.slice(1).map(doc => doc.id).filter(Boolean) as string[]; const next = { ...canonical, slug: requestedSlug, draft, status: 'draft' as const, updatedAt: now() }; try { const [ok] = await db.update(TABLE, [{ id: canonical.id!, record: next }]); if (!ok) return error('The existing content could not be saved. Nothing was deleted.', 500); if (duplicateIds.length) await db.delete(TABLE, duplicateIds); return json({ document: next, id: canonical.id, reused: true }); } catch (writeError) { console.error('CMS document update failed:', writeError); return error('The content could not be saved. Nothing was deleted.', 500); } } const stamp = now(); const record = { type, slug: requestedSlug, status: 'draft' as const, draft, createdAt: stamp, updatedAt: stamp }; try { const [id] = await db.add(TABLE, [record]); if (!id) return error('The new content could not be created.', 500); return json({ document: { ...record, id }, id }); } catch (writeError) { console.error('CMS document create failed:', writeError); return error('The new content could not be created. Check the fields and try again.', 500); } }],
  'PUT /api/admin/documents/:id': [...admin, async ctx => { const body = ctx.body as any; const requestedType = String(body.type || '').trim(); const requestedSlug = normalizeCmsSlug(body.slug, `${requestedType}-${Date.now()}`); if (!requestedType || !body.draft || typeof body.draft !== 'object') return error('Content type and draft content are required', 400); const draft = requestedType === 'location' ? locationDraft(body.draft) : body.draft; const all = await listDocs(); const [byId] = await db.get<CmsDoc>(TABLE, [ctx.params.id]); const candidates = all.filter(doc => doc.type === requestedType && doc.slug === requestedSlug); const canonical = byId || candidates.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0]; if (!canonical?.id) { const stamp = now(); try { const [id] = await db.add(TABLE, [{ type: requestedType, slug: requestedSlug, status: 'draft', draft, createdAt: stamp, updatedAt: stamp }]); return id ? json({ document: { id, type: requestedType, slug: requestedSlug, status: 'draft', draft, createdAt: stamp, updatedAt: stamp } }) : error('The new content could not be created.', 500); } catch (writeError) { console.error('CMS document replacement create failed:', writeError); return error('The content could not be created.', 500); } } const duplicates = all.filter(doc => doc.id !== canonical.id && doc.type === requestedType && doc.slug === requestedSlug).map(doc => doc.id).filter(Boolean) as string[]; const next = { ...canonical, type: requestedType, slug: requestedSlug, draft, updatedAt: now() }; try { const [ok] = await db.update(TABLE, [{ id: canonical.id, record: next }]); if (!ok) return error('The draft could not be saved. Your existing content was kept.', 500); if (duplicates.length) await db.delete(TABLE, duplicates); await saveRevision(next, ctx.user?.email ?? ctx.user?.userId ?? 'admin'); return json({ document: next }); } catch (writeError) { console.error('CMS document update failed:', writeError); return error('The draft could not be saved. Your existing content was kept.', 500); } }],
  'POST /api/admin/documents/:id/publish': [...admin, async ctx => { const body = ctx.body as any; const all = await listDocs(); const byId = all.find(doc => doc.id === ctx.params.id); const requestedType = String(body.type || byId?.type || '').trim(); const requestedSlug = normalizeCmsSlug(body.slug || byId?.slug, `${requestedType}-${Date.now()}`); const canonical = byId || all.filter(doc => doc.type === requestedType && doc.slug === requestedSlug).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0]; if (!canonical?.id) return error('Document not found. Refresh the CMS and select the content again.', 404); const draft = requestedType === 'location' ? locationDraft(body.draft || canonical.draft) : (body.draft || canonical.draft); const duplicates = all.filter(doc => doc.id !== canonical.id && doc.type === requestedType && doc.slug === requestedSlug).map(doc => doc.id).filter(Boolean) as string[]; const next = { ...canonical, type: requestedType, slug: requestedSlug, status: 'published' as const, draft: { ...draft }, published: { ...draft }, publishedAt: now(), updatedAt: now() }; try { const [ok] = await db.update(TABLE, [{ id: canonical.id, record: next }]); if (!ok) return error('The content could not be published. Your saved draft was kept.', 500); if (duplicates.length) await db.delete(TABLE, duplicates); await saveRevision(next, ctx.user?.email ?? ctx.user?.userId ?? 'admin'); return json({ document: next }); } catch (writeError) { console.error('CMS document publish failed:', writeError); return error('The content could not be published. Your saved draft was kept.', 500); } }],
  'POST /api/admin/documents/:id/unpublish': [...admin, async ctx => { const [existing] = await db.get<CmsDoc>(TABLE, [ctx.params.id]); if (!existing) return error('Document not found', 404); const next = { ...existing, status: 'draft' as const, updatedAt: now() }; const [ok] = await db.update(TABLE, [{ id: ctx.params.id, record: next }]); return ok ? json({ document: next }) : error('Unable to unpublish document', 500); }],
  'POST /api/admin/documents/:id/delete': [...admin, async ctx => { const [existing] = await db.get<CmsDoc>(TABLE, [ctx.params.id]); if (!existing) return error('Document not found', 404); const related = (await listDocs()).filter(doc => doc.id !== existing.id && doc.type === existing.type && doc.slug === existing.slug).map(doc => doc.id).filter(Boolean) as string[]; const ids = Array.from(new Set([existing.id, ...related])); try { const results = await db.delete(TABLE, ids); const deleted = results.every(Boolean); if (!deleted) return error('Some records could not be deleted. Refresh the CMS and try again.', 500); return json({ deleted: true, deletedCount: ids.length }); } catch (deleteError) { console.error('CMS document delete failed:', deleteError); return error('Unable to delete this content right now. Nothing else was changed.', 500); } }],
  'DELETE /api/admin/documents/:id': [...admin, async ctx => { const [existing] = await db.get<CmsDoc>(TABLE, [ctx.params.id]); if (!existing) return error('Document not found', 404); const related = (await listDocs()).filter(doc => doc.id !== existing.id && doc.type === existing.type && doc.slug === existing.slug).map(doc => doc.id).filter(Boolean) as string[]; const ids = Array.from(new Set([existing.id, ...related])); try { const results = await db.delete(TABLE, ids); const deleted = results.every(Boolean); if (!deleted) return error('Some records could not be deleted. Refresh the CMS and try again.', 500); return json({ deleted: true, deletedCount: ids.length }); } catch (deleteError) { console.error('CMS document delete failed:', deleteError); return error('Unable to delete this content right now. Nothing else was changed.', 500); } }],
  'GET /api/admin/revisions/:id': [...admin, async ctx => { const { items } = await db.list(REVISION_TABLE, { limit: 50, filter: { documentId: ctx.params.id } }); return json({ revisions: items }); }],
  'GET /api/admin/registrations': [...admin, async () => { const { items } = await db.list(REGISTRATION_TABLE, { limit: 200 }); return json({ registrations: items }); }],
  'PUT /api/admin/registrations/:id': [...admin, async ctx => { const [existing] = await db.get<any>(REGISTRATION_TABLE, [ctx.params.id]); if (!existing) return error('Registration not found', 404); const body = ctx.body as any; const next = { ...existing, status: body.status ?? existing.status, notes: body.notes ?? existing.notes, updatedAt: now() }; const [ok] = await db.update(REGISTRATION_TABLE, [{ id: ctx.params.id, record: next }]); return ok ? json({ registration: next }) : error('Unable to update registration', 500); }],
  'GET /api/admin/inquiries': [...admin, async () => { const { items } = await db.list<any>(INQUIRY_TABLE, { limit: 200 }); return json({ inquiries: items }); }],
  'GET /api/admin/newsletter': [...admin, async () => { const { items } = await db.list<any>(NEWSLETTER_TABLE, { limit: 200 }); return json({ subscribers: items }); }],
  'POST /api/admin/media': [...admin, async ctx => { const body = ctx.body as any; if (!body.filename || !body.contentType || !body.data) return error('filename, contentType and data are required', 400); const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '-'); const path = `${MEDIA_PREFIX}${Date.now()}-${safeName}`; const base64 = body.data.replace(/^data:[^;]+;base64,/, ''); const [ok] = await storage.write([{ path, content: base64, contentType: body.contentType }]); if (!ok) return error('Unable to upload media', 500); const [{ url }] = await storage.url([path]); return json({ path, url, storagePath: path }); }],
  'GET /api/admin/media': [...admin, async () => { const { paths } = await storage.list({ prefix: MEDIA_PREFIX, limit: 100 }); return json({ media: await storage.url(paths) }); }],
  'DELETE /api/admin/media': [...admin, async ctx => { const body = ctx.body as any; if (!body.path || !body.path.startsWith(MEDIA_PREFIX)) return error('Invalid media path', 400); const [ok] = await storage.delete([body.path]); return ok ? json({ deleted: true }) : error('Unable to delete media', 500); }],
});
