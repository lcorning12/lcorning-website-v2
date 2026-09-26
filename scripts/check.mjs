import fs from 'fs';
import path from 'path';
import { build, canonicalUrlFrom, isPublicUrl, markdownToHtml, parseFrontmatter, renderSubstack, renderIconLinks, tagList } from './lib.mjs';

const errors = [];
const expect = (condition, message) => {
  if (!condition) errors.push(message);
};

const config = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const expectedLinks = {
  x: 'https://x.com/LeeCorning',
  facebook: 'https://www.facebook.com/lcorning',
  linkedin: 'https://www.linkedin.com/in/leecorning/',
  instagram: '',
  youtube: '',
  github: 'https://github.com/lcorning12',
  substack: 'https://lcorning.substack.com',
};
for (const [id, url] of Object.entries(expectedLinks)) {
  const entry = config.links.find((link) => link.id === id);
  expect(entry && entry.url === url, `links.${id} should be ${url || 'empty'}`);
}
expect(config.substackUrl === 'https://lcorning.substack.com', 'substackUrl should be the live publication');
expect(config.nextlayer.url.trim() === '', 'nextlayer.url should be empty');
expect(
  fs.readFileSync('content/posts/example-draft.md', 'utf8').includes('draft: true'),
  'example draft must set draft: true'
);

expect(renderSubstack({ substackUrl: '' }) === '', 'empty Substack URL should render nothing');
expect(renderSubstack({ substackUrl: '   ' }) === '', 'blank Substack URL should render nothing');
const substack = renderSubstack({ substackUrl: 'https://example.substack.com' });
expect(substack.includes('https://example.substack.com/embed'), 'Substack embed should use the publication origin');
expect(substack.includes('Open the Substack'), 'Substack block should include a subscribe link');
const otherSubscribe = renderSubstack({ substackUrl: 'https://example.com/newsletters' });
expect(otherSubscribe.includes('https://example.com/newsletters') && !otherSubscribe.includes('<iframe'), 'Non-Substack URLs should be a link only');

const icons = renderIconLinks({
  links: [
    { id: 'x', label: 'X', url: 'https://x.com/LeeCorning' },
    { id: 'facebook', label: 'Facebook', url: '' },
    { id: 'linkedin', label: 'LinkedIn', url: '   ' },
  ],
});
expect(icons.includes('https://x.com/LeeCorning'), 'filled link should render');
expect(!icons.includes('Facebook') && !icons.includes('LinkedIn'), 'empty links should not render');
expect(!isPublicUrl('') && !isPublicUrl('TODO') && !isPublicUrl('https://'), 'empty and incomplete URLs are not public');

const parsed = parseFrontmatter(`---
title: "Hello"
date: 2026-09-26
category: writing
tags:
  - one
  - two
description: "A note."
canonical_url: "https://example.com/hello"
---
Body
`);
expect(tagList(parsed.data.tags).join(',') === 'one,two', 'block tags should parse');
expect(canonicalUrlFrom(parsed.data.canonical_url, 'hello.md') === 'https://example.com/hello', 'canonical_url should be kept');
expect(canonicalUrlFrom('', 'hello.md') === '', 'empty canonical_url should be omitted');
expect(tagList('alpha, beta').join(',') === 'alpha,beta', 'comma tags should parse');
let threw = false;
try {
  canonicalUrlFrom('not a url', 'hello.md');
} catch (error) {
  threw = /canonical_url/.test(error.message);
}
expect(threw, 'a bad canonical_url should fail the build');

const youtube = markdownToHtml('https://www.youtube.com/watch?v=abcdefghijk\n');
expect(youtube.includes('https://www.youtube-nocookie.com/embed/abcdefghijk'), 'YouTube URLs should become embeds');
const vimeo = markdownToHtml('https://vimeo.com/123456789\n');
expect(vimeo.includes('https://player.vimeo.com/video/123456789'), 'Vimeo URLs should become embeds');
const xpost = markdownToHtml('https://x.com/someone/status/9876543210\n');
expect(xpost.includes('https://platform.twitter.com/embed/Tweet.html?id=9876543210'), 'X status URLs should become embeds');
const fenced = markdownToHtml('```youtube\nabcdefghijk\n```\n');
expect(fenced.includes('https://www.youtube-nocookie.com/embed/abcdefghijk'), 'fenced youtube blocks should become embeds');
const placeholder = markdownToHtml('```youtube\nVIDEO_ID\n```\n');
expect(placeholder.includes('video-embed-placeholder') && !placeholder.includes('<iframe'), 'placeholder video ids should not create an iframe');

build({ includeDrafts: false, outDir: 'dist' });
build({ includeDrafts: true, outDir: '.preview' });

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const distFiles = walk('dist');
const distHtml = distFiles.filter((file) => file.endsWith('.html')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
expect(fs.existsSync('dist/index.html'), 'home page missing');
expect(fs.existsSync('dist/blog/index.html'), 'blog index missing');
expect(fs.existsSync('dist/links/index.html'), 'links page missing');
expect(!fs.existsSync('dist/blog/example-draft/index.html'), 'draft post was published');
expect(!fs.existsSync('dist/content'), 'source posts were copied into dist');
expect(distHtml.includes('https://x.com/LeeCorning'), 'production pages should link to X');
expect(distHtml.includes('https://www.facebook.com/lcorning'), 'production pages should link to Facebook');
expect(distHtml.includes('https://www.linkedin.com/in/leecorning/'), 'production pages should link to LinkedIn');
expect(distHtml.includes('https://github.com/lcorning12'), 'production pages should link to GitHub');
for (const label of ['Instagram', 'YouTube']) {
  expect(!distHtml.includes(`aria-label="${label}"`) && !distHtml.includes(`>${label}<`), `${label} should stay hidden`);
}
expect(distHtml.includes('aria-label="Substack"'), 'Substack profile icon should render');
expect(distHtml.includes('https://lcorning.substack.com/embed'), 'Substack embed should be on');
expect(distHtml.includes('Open the Substack'), 'Substack subscribe link should be on');
expect(distHtml.includes('Experimental Art') && distHtml.includes('Next Layer'), 'category sections missing');
expect(distHtml.includes('No published posts yet.'), 'empty state missing');
expect(!distHtml.includes('A Substack is coming soon.'), 'coming-soon note should be replaced by the subscribe block');
const iframeSrcs = [...distHtml.matchAll(/<iframe[^>]*src="([^"]+)"/g)].map((match) => match[1]);
expect(iframeSrcs.length > 0 && iframeSrcs.every((src) => src === 'https://lcorning.substack.com/embed'), 'the only iframe should be the Substack embed');
expect(distHtml.includes('name="viewport"'), 'viewport meta missing');
expect(!distHtml.includes('Example draft'), 'draft title leaked into production');
expect(!distHtml.includes('layout sample only'), 'draft banner leaked into production');

const forbidden = [
  'hello@leecorning.com',
  '456-7890',
  'TechFlow',
  'Sarah Chen',
  '$299',
  '$599',
  'ROI GUARANTEED',
  '5,000+',
  'beehiiv',
  'instagram.com',
  '$485K',
  'Cut costs by 60%',
  'lc@lcorning.com',
];
for (const phrase of forbidden) {
  expect(!distHtml.includes(phrase), `production HTML contains "${phrase}"`);
}

const allowed = [
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
  'https://x.com/LeeCorning',
  'https://www.facebook.com/lcorning',
  'https://www.linkedin.com/in/leecorning/',
  'https://github.com/lcorning12',
  'https://lcorning.substack.com',
  'http://www.w3.org/2000/svg',
];
const urls = [...distHtml.matchAll(/https?:\/\/[^"'\\\s<)]+/g)].map((match) => match[0].replace(/&amp;/g, '&'));
for (const url of urls) {
  const ok = allowed.some((prefix) => url.startsWith(prefix));
  expect(ok, `unexpected URL in production HTML: ${url}`);
}

const previewPost = fs.readFileSync('.preview/blog/example-draft/index.html', 'utf8');
expect(previewPost.includes('DRAFT — layout sample only'), 'preview post should be marked as a draft');
expect(previewPost.includes('video-embed-placeholder'), 'preview post should show embed frames');
expect(previewPost.includes('not facts about Lee Corning'), 'preview post should say it is not about Lee');
expect(previewPost.includes('content="noindex"'), 'preview build should be noindex');
expect(!previewPost.includes('Tesla'), 'draft post should not invent a Tesla claim');
expect(previewPost.includes('<li>example</li>') && previewPost.includes('<li>layout</li>'), 'draft post should show its tags');
expect(!previewPost.includes('rel="canonical"'), 'draft post has no canonical_url, so no canonical tag');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Checked production dist and draft preview (${urls.length} URLs allowed).`);
