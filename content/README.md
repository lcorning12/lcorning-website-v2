# Adding a post

Posts live in `content/posts/`. One Markdown file becomes one page. The production build skips anything with `draft: true`.

## 1. Create the file

Name it with the URL slug you want. `notes-on-a-sketch.md` is published at `blog/notes-on-a-sketch/`.

Use lowercase letters, numbers, and hyphens only. `README.md` in this folder is not a post; only files in `content/posts/` are.

## 2. Add front matter

Posts stay plain Markdown. A future cross-posting tool should write this same file, not HTML. The body below the front matter is the post.

```markdown
---
title: "Post title"
date: 2026-09-26
category: writing
tags:
  - notes
  - tools
description: "One sentence summary for the list page."
canonical_url: "https://example.com/original-post"
draft: false
---

Write the post here.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Plain text. |
| `date` | yes | `YYYY-MM-DD`. |
| `category` | yes | One id from the table below. |
| `tags` | no | A YAML list, `[one, two]`, or a comma-separated line. Shown on the post. Omit it for no tags. |
| `description` | no | One sentence for the list page and the meta description. |
| `canonical_url` | no | Original URL when this file is a cross-post. When it is an `http` or `https` URL, the page gets `<link rel="canonical">`. Leave it out, or leave it empty, and no canonical tag is added. |
| `draft` | no | `true` keeps the file in the repo and out of `npm run build`. Defaults to published. |

`category` must be one of:

| Category id | Section |
| --- | --- |
| `experimental-art` | Experimental Art |
| `videos` | Videos |
| `next-layer` | Next Layer |
| `writing` | Writing / Essays |

Set `draft: true` while you are still editing. Drafts stay in the repo and are left out of `npm run build`, which is what GitHub Pages and Netlify run.

## 3. Embed a video

Any of these on their own line become an embed:

```markdown
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://vimeo.com/123456789
https://x.com/someone/status/1234567890
```

Or use a fenced block:

````markdown
```youtube
VIDEO_ID
```

```vimeo
123456789
```

```x
https://x.com/someone/status/1234567890
```
````

`VIDEO_ID` for YouTube is the 11-character id. A placeholder that is not a real id renders as an empty frame instead of a broken player. Do not embed a video as if Lee made it unless it is actually his.

## 4. Build

From the repository root:

```bash
npm install
npm run build
```

Published files are written to `dist/`. Drafts are not in that folder.

To review a draft locally:

```bash
npm run preview
```

That writes the same site, including drafts, to `dist/` and marks those pages as drafts. Do not deploy the preview build. Run `npm run build` again before a production publish.

## 5. What not to add

Do not invent testimonials, prices, guarantees, statistics, or contact details. Profile URLs belong in `site.config.json`. If you do not know a URL, leave it empty.
