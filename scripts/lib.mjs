import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const CONFIG_PATH = path.join(ROOT, 'site.config.json');

const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isPublicUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (!url.hostname || !url.hostname.includes('.')) return false;
    return true;
  } catch {
    return false;
  }
}

export function activeLinks(config) {
  return (config.links || []).filter((link) => isPublicUrl(link.url));
}

export function loadConfig() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(config.categories) || config.categories.length === 0) {
    throw new Error('site.config.json needs a categories array');
  }
  if (!Array.isArray(config.links)) {
    throw new Error('site.config.json needs a links array');
  }
  const ids = new Set();
  for (const category of config.categories) {
    if (!category.id || !category.label) throw new Error('Each category needs an id and label');
    if (ids.has(category.id)) throw new Error(`Duplicate category ${category.id}`);
    ids.add(category.id);
  }
  return config;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    data[key] = value;
  }
  return { data, body: match[2] };
}

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date "${iso}". Use YYYY-MM-DD.`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date "${iso}".`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function readingMinutes(markdown) {
  const words = markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function loadPosts(config) {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const categories = new Set(config.categories.map((category) => category.id));
  const posts = [];
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const slug = file.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Post filename "${file}" must be a lowercase slug`);
    }
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (!data.title) throw new Error(`${file} is missing title`);
    if (!data.date) throw new Error(`${file} is missing date`);
    if (!categories.has(data.category)) {
      throw new Error(`${file} has unknown category "${data.category}"`);
    }
    const draft = data.draft === true;
    posts.push({
      slug,
      title: String(data.title),
      date: String(data.date),
      dateLabel: formatDate(String(data.date)),
      category: String(data.category),
      description: data.description ? String(data.description) : '',
      draft,
      minutes: readingMinutes(body),
      body,
    });
  }
  posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
  return posts;
}

function youtubeId(value) {
  const fromUrl = value.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (fromUrl) return fromUrl[1];
  if (YOUTUBE_ID.test(value)) return value;
  return null;
}

function vimeoId(value) {
  const fromUrl = value.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (fromUrl) return fromUrl[1];
  if (VIMEO_ID.test(value)) return value;
  return null;
}

function xStatusId(value) {
  const fromUrl = value.match(/(?:x\.com|twitter\.com)\/[^/\s]+\/status\/(\d+)/);
  if (fromUrl) return fromUrl[1];
  if (/^\d+$/.test(value) && value.length >= 5) return value;
  return null;
}

function placeholder(kind, detail) {
  const labels = { youtube: 'YOUTUBE', vimeo: 'VIMEO', x: 'X' };
  return `<figure class="video-embed video-embed-${kind} video-embed-placeholder">
  <div class="video-embed-frame" role="img" aria-label="${labels[kind] || 'Video'} embed placeholder">
    <span class="video-embed-kicker">${labels[kind] || 'VIDEO'}</span>
    <span class="video-embed-note">${escapeHtml(detail)}</span>
  </div>
</figure>`;
}

function iframeEmbed(kind, src, title) {
  return `<figure class="video-embed video-embed-${kind}">
  <iframe src="${escapeHtml(src)}" title="${escapeHtml(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</figure>`;
}

export function renderEmbed(kind, rawValue) {
  const value = String(rawValue || '').trim();
  if (kind === 'youtube') {
    const id = youtubeId(value);
    if (!id) return placeholder('youtube', 'Add an 11-character YouTube id to show the player.');
    return iframeEmbed('youtube', `https://www.youtube-nocookie.com/embed/${id}`, 'YouTube video');
  }
  if (kind === 'vimeo') {
    const id = vimeoId(value);
    if (!id) return placeholder('vimeo', 'Add a numeric Vimeo id to show the player.');
    return iframeEmbed('vimeo', `https://player.vimeo.com/video/${id}`, 'Vimeo video');
  }
  if (kind === 'x') {
    const id = xStatusId(value);
    if (!id) return placeholder('x', 'Add an X status URL to show the post.');
    return iframeEmbed('x', `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true`, 'Post on X');
  }
  return placeholder('youtube', 'Unsupported embed.');
}

function embedFromUrl(url) {
  if (youtubeId(url) && /youtube\.com|youtu\.be/.test(url)) return renderEmbed('youtube', url);
  if (vimeoId(url) && /vimeo\.com/.test(url)) return renderEmbed('vimeo', url);
  if (xStatusId(url) && /(x\.com|twitter\.com)/.test(url)) return renderEmbed('x', url);
  return null;
}

export function markdownToHtml(markdown) {
  const embeds = [];
  let source = String(markdown).replace(/```(youtube|vimeo|x)\s*\n([\s\S]*?)```/gi, (_, kind, body) => {
    const id = embeds.length;
    embeds.push(renderEmbed(kind.toLowerCase(), body.trim()));
    return `\n\n<!--EMBED:${id}-->\n\n`;
  });
  source = source.replace(/^(https?:\/\/\S+)\s*$/gm, (line) => {
    const embed = embedFromUrl(line.trim());
    if (!embed) return line;
    const id = embeds.length;
    embeds.push(embed);
    return `\n\n<!--EMBED:${id}-->\n\n`;
  });
  let html = marked.parse(source, { gfm: true, breaks: false });
  html = html.replace(/<!--EMBED:(\d+)-->/g, (_, n) => embeds[Number(n)] || '');
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  return html;
}

function relHref(fromDir, toPath) {
  const hashAt = toPath.indexOf('#');
  const hash = hashAt >= 0 ? toPath.slice(hashAt) : '';
  const file = hashAt >= 0 ? toPath.slice(0, hashAt) : toPath;
  let relative = path.relative(fromDir || '.', file || '.').split(path.sep).join('/');
  if (!relative) relative = '.';
  return relative + hash;
}

const ICONS = {
  x: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  facebook: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
  linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM6.954 20.452H3.56V9h3.394v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  instagram: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>',
  youtube: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
  github: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  substack: '<path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>',
  link: '<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.2-3.2a3 3 0 0 1 4.2 4.2l-1.6 1.6a1 1 0 1 1-1.4-1.4l1.6-1.6a1 1 0 0 0-1.4-1.4l-3.2 3.2a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3.2 3.2a1 1 0 0 1-1.4-1.4l1.6-1.6a1 1 0 1 0-1.4-1.4L7.4 12a3 3 0 0 0 4.2 4.2l1.6-1.6a1 1 0 0 1 1.4 0 1 1 0 0 1 0 1.4l-1.6 1.6a5 5 0 0 1-7-7l1.6-1.6a1 1 0 0 1 1.4 0z"/>',
};

function iconSvg(id) {
  const pathData = ICONS[id] || ICONS.link;
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${pathData}</svg>`;
}

export function renderIconLinks(config) {
  return activeLinks(config)
    .map((link) => {
      const url = link.url.trim();
      return `<a class="icon-link" href="${escapeHtml(url)}" target="_blank" rel="me noopener noreferrer" aria-label="${escapeHtml(link.label)}">${iconSvg(link.id)}</a>`;
    })
    .join('');
}

export function renderLinkTiles(config) {
  return activeLinks(config)
    .map((link) => {
      const url = new URL(link.url.trim());
      const shown = `${url.host}${url.pathname}`.replace(/\/$/, '');
      return `<a class="link-tile" href="${escapeHtml(link.url.trim())}" target="_blank" rel="me noopener noreferrer">
        ${iconSvg(link.id)}
        <span class="link-tile-label">${escapeHtml(link.label)}</span>
        <span class="link-tile-url">${escapeHtml(shown)}</span>
      </a>`;
    })
    .join('');
}

export function renderSubstack(config) {
  if (!isPublicUrl(config.substackUrl)) return '';
  const url = config.substackUrl.trim();
  const parsed = new URL(url);
  const embed = parsed.hostname === 'substack.com' || parsed.hostname.endsWith('.substack.com')
    ? `<iframe class="substack-frame" src="${escapeHtml(parsed.origin)}/embed" title="Subscribe on Substack" loading="lazy"></iframe>`
    : '';
  return `<aside class="substack-slot" aria-label="Substack">
    <p class="kicker">[ SUBSTACK ]</p>
    <h2 class="section-title">Subscribe</h2>
    <p><a class="text-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open the Substack</a></p>
    ${embed}
  </aside>`;
}

function categoryById(config, id) {
  return config.categories.find((category) => category.id === id);
}

function categoryHref(fromDir, id) {
  if (fromDir === '' || fromDir === 'blog') return `#${id}`;
  return relHref(fromDir, `blog/index.html#${id}`);
}

const NAV = [
  { id: 'blog', label: 'Blog' },
  { id: 'experimental-art', label: 'Art' },
  { id: 'videos', label: 'Videos' },
  { id: 'next-layer', label: 'Next Layer' },
  { id: 'writing', label: 'Essays' },
  { id: 'links', label: 'Links' },
];

function navHref(fromDir, id) {
  if (id === 'blog') return relHref(fromDir, 'blog/index.html');
  if (id === 'links') return relHref(fromDir, 'links/index.html');
  return categoryHref(fromDir, id);
}

function layout({ config, title, description, fromDir, active, main, includeDrafts }) {
  const asset = (file) => relHref(fromDir, file);
  const home = relHref(fromDir, 'index.html');
  const icons = renderIconLinks(config);
  const links = NAV.map((item) => {
    const current = item.id === active ? ' aria-current="page"' : '';
    return `<a href="${navHref(fromDir, item.id)}"${current}>${escapeHtml(item.label)}</a>`;
  }).join('');
  const robots = includeDrafts ? '\n    <meta name="robots" content="noindex">' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">${robots}
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%230A0E1A'/%3E%3Ctext x='2' y='13' fill='%23FF4500' font-size='12' font-family='monospace'%3EL%3C/text%3E%3C/svg%3E">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <link href="${asset('style.css')}" rel="stylesheet">
</head>
<body>
    <a class="skip-link" href="#content">Skip to content</a>
    <nav class="site-nav" aria-label="Primary">
        <div class="container mx-auto px-6 nav-inner">
            <a class="logo" href="${home}"><span>LEE</span> CORNING</a>
            <input id="nav-check" class="nav-check" type="checkbox">
            <label for="nav-check" class="nav-toggle"><span class="sr-only">Menu</span><span></span><span></span><span></span></label>
            <div class="nav-panel" data-nav-panel>
                ${links}
                ${icons ? `<span class="nav-icons">${icons}</span>` : ''}
            </div>
        </div>
    </nav>
    <main id="content">
        ${main}
    </main>
    ${renderFooter(config, fromDir)}
    <script src="${asset('script.js')}"></script>
</body>
</html>
`;
}

function renderFooter(config, fromDir) {
  const icons = renderIconLinks(config);
  const sections = config.categories
    .map((category) => `<li><a href="${categoryHref(fromDir, category.id)}">${escapeHtml(category.label)}</a></li>`)
    .join('');
  const location = config.location
    ? `<li>${escapeHtml(config.location)}</li>`
    : '';
  return `<footer class="site-footer">
    <div class="container mx-auto px-6">
        <div class="footer-grid">
            <div>
                <div class="footer-name">${escapeHtml(config.siteName)}</div>
                <p>${escapeHtml(config.description)}</p>
                ${icons ? `<div class="footer-icons">${icons}</div>` : ''}
            </div>
            <div>
                <h2>Sections</h2>
                <ul>${sections}</ul>
            </div>
            <div>
                <h2>Site</h2>
                <ul>
                    <li><a href="${relHref(fromDir, 'blog/index.html')}">Blog</a></li>
                    <li><a href="${relHref(fromDir, 'links/index.html')}">Links</a></li>
                </ul>
            </div>
            <div>
                <h2>Contact</h2>
                <ul>
                    <li>Contact details coming soon</li>
                    ${location}
                </ul>
            </div>
        </div>
        <p class="footer-copy">&copy; ${new Date().getUTCFullYear()} ${escapeHtml(config.siteName)}. All rights reserved.</p>
    </div>
</footer>`;
}

function postCard(post, fromDir) {
  const category = post.category;
  const href = relHref(fromDir, `blog/${post.slug}/index.html`);
  const draft = post.draft ? '<span class="draft-pill">DRAFT</span>' : '';
  return `<article class="post-card" data-category="${escapeHtml(category)}">
    <p class="kicker">${escapeHtml(categoryLabel(post))}${draft}</p>
    <h3><a href="${href}">${escapeHtml(post.title)}</a></h3>
    ${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}
    <p class="meta"><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateLabel)}</time> · ${post.minutes} min read</p>
</article>`;
}

function categoryLabel(post) {
  return post.categoryLabel || post.category;
}

function withLabels(posts, config) {
  return posts.map((post) => ({
    ...post,
    categoryLabel: categoryById(config, post.category)?.label || post.category,
  }));
}

function sectionExtras(config, category) {
  if (category.id === 'next-layer') {
    if (isPublicUrl(config.nextlayer?.url)) {
      return `<p><a class="text-link" href="${escapeHtml(config.nextlayer.url.trim())}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.nextlayer.company || 'NextLayerUS')}</a></p>`;
    }
    return `<!-- TODO: set nextlayer.url in site.config.json. No NextLayerUS URL was in the repo. -->
    <p class="section-note">Company site link is not listed yet.</p>`;
  }
  if (category.id === 'writing') {
    if (isPublicUrl(config.substackUrl)) return renderSubstack(config);
    return '<p class="section-note">A Substack is coming soon.</p>';
  }
  return '';
}

function categorySections(config, posts, fromDir) {
  return config.categories.map((category, index) => {
    const items = posts.filter((post) => post.category === category.id);
    const cards = items.length
      ? `<div class="card-grid">${items.map((post) => postCard(post, fromDir)).join('')}</div>`
      : '<p class="section-note">No posts in this section yet.</p>';
    const tone = index % 2 === 0 ? 'band-white' : 'band-light';
    return `<section id="${escapeHtml(category.id)}" class="band ${tone}">
    <div class="container mx-auto px-6">
        <p class="kicker">[ ${escapeHtml(category.label.toUpperCase())} ]</p>
        <h2 class="section-title">${escapeHtml(category.label)}</h2>
        <p class="section-dek">${escapeHtml(category.description || '')}</p>
        ${sectionExtras(config, category)}
        ${cards}
    </div>
</section>`;
  }).join('\n');
}

function filterBar(config) {
  const links = [{ id: 'all-posts', label: 'All' }].concat(
    config.categories.map((category) => ({ id: category.id, label: category.label })),
  );
  const anchors = links
    .map((link) => `<a href="#${escapeHtml(link.id)}">${escapeHtml(link.label)}</a>`)
    .join('');
  return `<nav class="filter-bar" aria-label="Post sections">${anchors}</nav>`;
}

function homeMain(config, posts) {
  const latest = posts.slice(0, 6);
  const list = latest.length
    ? `<div class="card-grid">${latest.map((post) => postCard(post, '')).join('')}</div>`
    : '<p class="empty-state">No published posts yet.</p>';
  const tiles = renderLinkTiles(config);
  return `<section class="hero">
    <div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-orb" aria-hidden="true"></div>
    <div class="container mx-auto px-6 hero-inner">
        <div>
            <p class="kicker kicker-on-dark">[ FIELD NOTES ]</p>
            <h1>LEE<br>CORNING</h1>
            <p class="hero-dek">${escapeHtml(config.description)}</p>
            <div class="hero-actions">
                <a class="btn-accent" href="${relHref('', 'blog/index.html')}">[ READ THE BLOG ]</a>
                <a class="btn-ghost" href="${relHref('', 'links/index.html')}">[ LINKS ]</a>
            </div>
        </div>
        <div class="hero-mark" aria-hidden="true"><span>LC</span></div>
    </div>
</section>
<section class="band band-light" id="latest">
    <div class="container mx-auto px-6">
        <p class="kicker">[ LATEST ]</p>
        <h2 class="section-title">Posts</h2>
        ${list}
        <p class="section-more"><a class="text-link" href="${relHref('', 'blog/index.html')}">All posts</a></p>
    </div>
</section>
${categorySections(config, posts, '')}
<section class="band band-dark" id="links-home">
    <div class="container mx-auto px-6">
        <p class="kicker kicker-on-dark">[ LINKS ]</p>
        <h2 class="section-title light">Find Lee</h2>
        ${tiles ? `<div class="link-grid">${tiles}</div>` : '<p class="section-note light">No links listed yet.</p>'}
        <p class="section-more"><a class="text-link on-dark" href="${relHref('', 'links/index.html')}">Links page</a></p>
    </div>
</section>`;
}

function blogMain(config, posts) {
  const list = posts.length
    ? `<div class="card-grid">${posts.map((post) => postCard(post, 'blog')).join('')}</div>`
    : '<p class="empty-state">No published posts yet.</p>';
  return `<section class="page-hero">
    <div class="container mx-auto px-6">
        <p class="kicker kicker-on-dark">[ BLOG ]</p>
        <h1>Posts</h1>
        <p class="hero-dek">Experimental art, videos, Next Layer, and writing.</p>
    </div>
</section>
<section class="band band-light" id="all-posts">
    <div class="container mx-auto px-6">
        ${filterBar(config)}
        ${list}
    </div>
</section>
${categorySections(config, posts, 'blog')}`;
}

function linksMain(config) {
  const tiles = renderLinkTiles(config);
  return `<section class="page-hero">
    <div class="container mx-auto px-6">
        <p class="kicker kicker-on-dark">[ LINKS ]</p>
        <h1>Links</h1>
        <p class="hero-dek">Elsewhere on the web.</p>
    </div>
</section>
<section class="band band-light">
    <div class="container mx-auto px-6">
        ${tiles ? `<div class="link-grid">${tiles}</div>` : '<p class="empty-state">No links listed yet.</p>'}
    </div>
</section>`;
}

function postMain(config, post) {
  const category = categoryById(config, post.category);
  const banner = post.draft
    ? '<p class="draft-banner">DRAFT — layout sample only. This page is excluded from the production build.</p>'
    : '';
  return `${banner}
<section class="page-hero">
    <div class="container mx-auto px-6">
        <p class="kicker kicker-on-dark"><a href="${relHref(`blog/${post.slug}`, 'blog/index.html')}#${escapeHtml(post.category)}">${escapeHtml(category?.label || post.category)}</a></p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta on-dark"><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateLabel)}</time> · ${post.minutes} min read</p>
    </div>
</section>
<article class="post-body">
    <div class="container mx-auto px-6 prose-post">
        ${markdownToHtml(post.body)}
    </div>
</article>`;
}

function notFoundMain() {
  return `<section class="page-hero">
    <div class="container mx-auto px-6">
        <p class="kicker kicker-on-dark">[ 404 ]</p>
        <h1>Page not found</h1>
        <p class="hero-dek"><a class="text-link on-dark" href="index.html">Back home</a></p>
    </div>
</section>`;
}

function writePage(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

export function build({ includeDrafts = false, outDir = 'dist' } = {}) {
  const config = loadConfig();
  const allPosts = withLabels(loadPosts(config), config);
  const posts = includeDrafts ? allPosts : allPosts.filter((post) => !post.draft);
  const destination = path.resolve(ROOT, outDir);
  if (destination === ROOT || !destination.startsWith(ROOT + path.sep)) {
    throw new Error(`Refusing to write outside the repo: ${destination}`);
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });

  const page = (opts) => layout({ config, includeDrafts, ...opts });
  writePage(path.join(destination, 'index.html'), page({
    title: config.siteName,
    description: config.description,
    fromDir: '',
    active: 'home',
    main: homeMain(config, posts),
  }));
  writePage(path.join(destination, 'blog', 'index.html'), page({
    title: `Blog — ${config.siteName}`,
    description: 'Posts on experimental art, videos, Next Layer, and writing.',
    fromDir: 'blog',
    active: 'blog',
    main: blogMain(config, posts),
  }));
  writePage(path.join(destination, 'links', 'index.html'), page({
    title: `Links — ${config.siteName}`,
    description: 'Personal links for Lee Corning.',
    fromDir: 'links',
    active: 'links',
    main: linksMain(config),
  }));
  writePage(path.join(destination, '404.html'), page({
    title: `Not found — ${config.siteName}`,
    description: 'That page is not on this site.',
    fromDir: '',
    active: '',
    main: notFoundMain(),
  }));
  for (const post of posts) {
    writePage(path.join(destination, 'blog', post.slug, 'index.html'), page({
      title: `${post.title} — ${config.siteName}`,
      description: post.description || config.description,
      fromDir: `blog/${post.slug}`,
      active: 'blog',
      main: postMain(config, post),
    }));
  }
  fs.copyFileSync(path.join(ROOT, 'style.css'), path.join(destination, 'style.css'));
  fs.copyFileSync(path.join(ROOT, 'script.js'), path.join(destination, 'script.js'));
  fs.writeFileSync(path.join(destination, '.nojekyll'), '');
  const drafts = allPosts.filter((post) => post.draft).length;
  const mode = includeDrafts ? 'preview, drafts included' : 'production, drafts excluded';
  console.log(`Built ${posts.length} post(s), ${drafts} draft(s) in source (${mode}) → ${path.relative(ROOT, destination) || '.'}`);
  return { posts, drafts, destination };
}
