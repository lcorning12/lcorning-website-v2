# Lee Corning

Personal site for [lcorning.com](https://lcorning.com). It is a static blog and a links page. The published files are generated into `dist/` and can be hosted on GitHub Pages or Netlify.

GitHub Pages for this repo currently deploys from `main` to `https://lcorning12.github.io/lcorning-website-v2`. The workflow builds `dist/` and uploads only that folder. This does not change DNS.

## Add a post

See [content/README.md](content/README.md). Short version: add one Markdown file to `content/posts/` with `title`, `date`, `category`, `tags`, `description`, and an optional `canonical_url`, then run `npm run build`. The body stays Markdown so a later cross-posting tool can write the same files.

`content/posts/example-draft.md` is a layout sample with `draft: true`. The production build does not publish it. `npm run preview` includes drafts so the layout can be reviewed locally. Do not deploy a preview build.

## Commands

```bash
npm install
npm test     # production build, draft preview, and checks
npm run build    # dist/, drafts excluded
npm run preview  # dist/, drafts included, noindex
```

Open `dist/index.html` with any static server. Paths are relative, so the same files work at a domain root or under `/lcorning-website-v2/`.

## Config Lee still needs to fill in

All of this is in `site.config.json`. Empty URLs are omitted from the HTML.

| Key | Current value | What to set |
| --- | --- | --- |
| `substackUrl` | empty | Substack publication URL. Until then, the subscribe link and embed stay hidden. The writing section says a Substack is coming soon. |
| `nextlayer.url` | empty | NextLayerUS site URL. None was in the repo. The Next Layer section does not link anywhere yet. |
| `links` → X | `https://x.com/LeeCorning` | Set |
| `links` → Facebook | `https://www.facebook.com/lcorning` | Set |
| `links` → LinkedIn | `https://www.linkedin.com/in/leecorning/` | Set |
| `links` → GitHub | `https://github.com/lcorning12` | Set |
| `links` → Instagram | empty | Profile URL. Hidden until set. |
| `links` → YouTube | empty | Profile URL. Hidden until set. |
| `links` → Substack | empty | Profile URL, if it should also appear with the other icons. Hidden until set. |

Do not guess the empty URLs. Do not add testimonials, prices, guarantees, statistics, or contact details that are not already known.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which publishes `dist/` to GitHub Pages. Netlify can use the `netlify.toml` build command and publish directory. Do not commit `dist/`.
