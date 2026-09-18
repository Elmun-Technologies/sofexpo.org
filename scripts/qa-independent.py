#!/usr/bin/env python3
"""Independent QA pass over the built site — deliberately NOT the project's own audit,
so a bug in scripts/seo-audit.mjs cannot hide here. Reads dist/ and dist-hosts/*."""
import json, os, re, statistics, sys, hashlib
from collections import Counter, defaultdict

ROOT = '/home/user/sofexpo.org'
HOSTS = {'sofexpo.org (alias, dist/)': f'{ROOT}/dist'}
for h in sorted(os.listdir(f'{ROOT}/dist-hosts')):
    HOSTS[f'{h} (subdomain)'] = f'{ROOT}/dist-hosts/{h}'

pages = defaultdict(dict)      # host -> url -> html
findings = defaultdict(list)   # rule -> messages
stats = defaultdict(list)

def visible(html):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', html, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

for label, d in HOSTS.items():
    if not os.path.isdir(d):
        continue
    built_paths = set()          # real files, for asset checks
    urls_here = set()            # URL space of this host, for link/canonical checks
    for dirpath, _, files in os.walk(d):
        for f in files:
            rel = os.path.relpath(os.path.join(dirpath, f), d).replace(os.sep, '/')
            built_paths.add('/' + rel)
            if f == 'index.html':
                urls_here.add('/' + rel[: -len('index.html')])
            elif f.endswith('.html'):
                urls_here.add('/' + rel[: -5])
    built_paths |= {u for u in urls_here if u != '/' and not u.endswith('/')}
    # index.html files are URLs; also record raw files for asset existence
    for dirpath, _, files in os.walk(d):
        for f in files:
            if not f.endswith('.html'):
                continue
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, d).replace(os.sep, '/')
            url = '/' + rel[: -len('index.html')] if rel.endswith('index.html') else '/' + rel
            html = open(p, encoding='utf-8').read()
            pages[label][url] = html
            loc = url.split('/')[1] if url.count('/') > 1 else ''
            # ---- per-page rules
            if len(re.findall(r'<h1[\s>]', html)) != 1:
                findings['h1: exactly one'].append(f'{label} {url}: {len(re.findall(chr(60)+"h1", html))}')
            m = re.search(r'<title>(.*?)</title>', html, re.S)
            if not m or not (25 <= len(m.group(1).strip()) <= 100):
                findings['title length 25-100'].append(f'{label} {url}: {len(m.group(1).strip()) if m else "missing"}')
            md = re.search(r'<meta name="description" content="([^"]*)"', html)
            if not md or not (60 <= len(md.group(1)) <= 230):
                findings['description length 60-230'].append(f'{label} {url}: {len(md.group(1)) if md else "missing"}')
            if '<meta name="viewport"' not in html:
                findings['viewport'].append(f'{label} {url}')
            if 'charset=' not in html:
                findings['charset'].append(f'{label} {url}')
            lang = re.search(r'<html[^>]*lang="([^"]+)"', html)
            want = 'ru' if loc == 'ru' else 'en'
            if lang and lang.group(1) != want:
                findings['html lang matches dir'].append(f'{label} {url}: {lang.group(1)}')
            can = re.search(r'<link rel="canonical" href="([^"]+)"', html)
            noindex = 'noindex' in (re.search(r'<meta name="robots" content="([^"]*)"', html).group(1)
                                    if re.search(r'<meta name="robots" content="([^"]*)"', html) else '')
            if not can:
                findings['canonical present'].append(f'{label} {url}')
            else:
                path = re.sub(r'https?://[^/]+', '', can.group(1))
                if path not in urls_here and path.rstrip('/') not in urls_here and not noindex:
                    findings['canonical → page that does not exist on this host'].append(f'{label} {url} → {can.group(1)}')
                if not noindex and path.rstrip('/') != url.rstrip('/'):
                    findings['canonical self-matches URL'].append(f'{label} {url} → {path}')
            for tag in ['og:title', 'og:type', 'og:image']:
                if f'property="{tag}"' not in html and f'name="{tag}"' not in html:
                    findings[f'og:{tag.split(":")[1]}'].append(f'{label} {url}')
            if 'name="twitter:card"' not in html:
                findings['twitter:card'].append(f'{label} {url}')
            # hreflang
            hl = re.findall(r'<link rel="alternate" hreflang="([a-z-]+)"', html)
            if noindex:
                if hl:
                    findings['noindex page must not carry hreflang'].append(f'{label} {url}')
            elif not {'ru', 'en', 'x-default'} <= set(hl):
                findings['hreflang ru+en+x-default'].append(f'{label} {url}: {hl}')
            # JSON-LD
            for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
                try:
                    json.loads(block)
                except Exception as e:
                    findings['JSON-LD parses'].append(f'{label} {url}: {e}')
            if '@type' not in html and not noindex:
                findings['has structured data'].append(f'{label} {url}')
            # images
            imgs = re.findall(r'<img\b[^>]*>', html)
            for i in imgs:
                if 'alt="' not in i or re.search(r'alt=""', i):
                    findings['every <img> has alt text'].append(f'{label} {url}: {i[:70]}')
                if 'loading="' not in i:
                    findings['lazy loading on content images'].append(f'{label} {url}: {i[:60]}')
                if not ('width="' in i and 'height="' in i):
                    findings['width/height on images (CLS)'].append(f'{label} {url}: {i[:60]}')
            stats['images per page'].append(len(imgs))
            # words
            words = len(visible(html).split())
            stats['visible words per page'].append(words)
            if words < 260 and not url.endswith('404.html'):
                findings['thin page (<260 words)'].append(f'{label} {url}: {words}')
            # headings order
            seq = [len(h) for h in re.findall(r'<h([1-6])[\s>]', html)]
            for a, b in zip(seq, seq[1:]):
                if b - a > 1:
                    findings['no skipped heading level'].append(f'{label} {url}: h{a}→h{b}')
                    break
            # links
            for href, text in re.findall(r'<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>', html, re.S):
                if not re.sub(r'<[^>]+>', '', text).strip() and 'aria-label' not in href:
                    if not re.search(r'<(img|svg)\b', text):
                        findings['anchor text not empty'].append(f'{label} {url}: {href[:50]}')
                if href.startswith(('http://localhost', 'http://127', 'example.com', '/TODO')):
                    findings['dev URL leaked'].append(f'{label} {url}: {href[:60]}')
                if href.startswith('/'):
                    target = href.split('#')[0].split('?')[0]
                    if target and target not in urls_here and target not in built_paths:
                        findings['relative link resolves on this host'].append(f'{label} {url} → {target}')
                    elif target and not target.endswith('/') and not os.path.splitext(target)[1]:
                        findings['trailing slash on internal links'].append(f'{label} {url} → {target}')
                elif href.startswith('https://') and 'sofexpo.org' in href:
                    tgt = re.sub(r'https?://', '', href.split('#')[0].split('?')[0])
                    host, _, path = tgt.partition('/')
                    dd = os.path.join(ROOT, 'dist-hosts', host)
                    if os.path.isdir(dd):
                        clean = path.strip('/')
                        ok = os.path.exists(os.path.join(dd, clean, 'index.html')) or (clean and os.path.exists(os.path.join(dd, clean)))
                        if not ok:
                            findings['absolute cross-host link resolves'].append(f'{label} {url} → {href}')
                elif href.startswith('/files/'):
                    if not os.path.exists(os.path.join(d, href.lstrip('/'))):
                        findings['/files/ asset exists'].append(f'{label} {url} → {href}')
            # text hygiene
            body = visible(html)
            if re.search(r'lorem ipsum|TODO|TBD|FIXME|placeholder', body, re.I):
                findings['no lorem/TODO in copy'].append(f'{label} {url}')
            if re.search(r'[\u4e00-\u9fff\u3040-\u30ff]', body):
                findings['no CJK characters in copy'].append(f'{label} {url}')
            if re.search(r'\b(click here|поддробнее|более подробно|уникальн|индивидуальн|инновационн)', body, re.I):
                findings['no fluff phrases'].append(f'{label} {url}: {m.group(0) if (m:=re.search(r"(click here|поддробнее|более подробно|уникальн|индивидуальн|инновационн)", body, re.I)) else ""}')
            stats['js bytes per page'].append(sum(len(s) for s in re.findall(r'<script(?![^>]*ld\+json)(?![^>]*type="application/)[^>]*>(.*?)</script>', html, re.S)))
            stats['internal links per page'].append(len(re.findall(r'<a\b[^>]*href="/', html)))
    # ---- host-level rules
    idx = {u: h for u, h in pages[label].items() if 'noindex' not in h}
    sm = f'{d}/sitemap-0.xml'
    if os.path.exists(sm):
        listed = set(re.findall(r'<loc>(?:https?://[^/]+)?(/[^<]*)</loc>', open(sm, encoding='utf-8').read()))
        want = {u for u in pages[label] if u.endswith('/') and 'noindex' not in pages[label][u] and not u.endswith('404/')}
        missing = want - set(listed)
        extra = set(listed) - want
        if missing:
            findings['sitemap covers every indexable page'].append(f'{label}: {len(missing)} missing, e.g. {sorted(missing)[:3]}')
        if extra:
            findings['sitemap lists no noindex/404'].append(f'{label}: {len(extra)} extra, e.g. {sorted(extra)[:3]}')
    else:
        findings['sitemap exists'].append(label)
    rb = f'{d}/robots.txt'
    if os.path.exists(rb):
        t = open(rb).read()
        if 'Sitemap:' not in t:
            findings['robots has Sitemap line'].append(label)
    else:
        findings['robots.txt exists'].append(label)
    if not os.path.exists(f'{d}/404/index.html') and not os.path.exists(f'{d}/404.html'):
        findings['404 page exists'].append(label)
    # ru/en parity
    def strip(u):
        return re.sub(r'^/(ru|en)', '', u) or '/'
    per = defaultdict(set)
    for u in pages[label]:
        m = re.match(r'^/(ru|en)(/.*)?$', u)
        if m:
            per[(m.group(2) or '/')].add(m.group(1))
    for k, v in sorted(per.items()):
        if not {'ru', 'en'} <= v:
            findings['ru/en parity (each path in both locales)'].append(f'{label} {k}: only {sorted(v)}')
    # duplicate titles
    dup = [t for t, c in Counter(re.search(r'<title>(.*?)</title>', h, re.S).group(1)
                                 for h in pages[label].values() if re.search(r'<title>', h)).items() if c > 1]
    for t in dup:
        findings['titles unique per host'].append(f'{label}: "{t[:60]}" used more than once')
    # duplicate bodies (same text on two URLs)
    seen = {}
    for u, h in pages[label].items():
        dgs = hashlib.md5(visible(h).encode()).hexdigest()
        if dgs in seen:
            findings['no duplicate body text'].append(f'{label}: {seen[dgs]} == {u}')
        else:
            seen[dgs] = u

# ---- motion rules (design, enforced here because the design doc is not a test) ----
motion_findings = []
for label, d in HOSTS.items():
    css_dir = os.path.join(d, '_astro')
    if not os.path.isdir(css_dir):
        continue
    css = ''.join(open(os.path.join(css_dir, f), encoding='utf-8').read() for f in os.listdir(css_dir) if f.endswith('.css'))
    for m in re.finditer(r'[^{}]*:hover[^{}]*\{[^}]*\}', css):
        if re.search(r'translate[XY]?\(|scale\(', m.group(0)):
            motion_findings.append(f'{label}: hover moves the layout — {m.group(0)[:70].strip()}')
    if 'will-change' in css:
        motion_findings.append(f'{label}: will-change present (no animation should need it)')
    if '@keyframes' in css and 'prefers-reduced-motion' not in css:
        motion_findings.append(f'{label}: @keyframes without a prefers-reduced-motion block')
    for m in re.finditer(r'\.[a-z_-]+__go[^{}]*\{[^}]*opacity:\s*0[^.5]', css):
        motion_findings.append(f'{label}: affordance hidden until hover — {m.group(0)[:60]}')
    if re.search(r'transition:[^;]*transform', css):
        for m in re.finditer(r'([^{}]{0,30}):?[^{}]*\{[^}]*transition:[^;}]*transform[^}]*\}', css):
            sel = m.group(1).strip().splitlines()[-1] if m.group(1) else '?'
            if not re.search(r'(summary|burger|nav-open|\.acc)', sel):
                motion_findings.append(f'{label}: transition on transform at "{sel[:40]}"')
for f in motion_findings:
    findings['motion (hover must be state, not theatre)'].append(f)

print('=== hosts / page counts ===')
for label in pages:
    print(f'  {label:36} {len(pages[label]):4} html files')
print()
print('=== distributions ===')
for k, v in stats.items():
    if v:
        print(f'  {k:28} median {statistics.median(v):7.0f} · min {min(v):6.0f} · max {max(v):7.0f}')
print()
total_fail = sum(len(v) for v in findings.values())
print(f'=== findings: {len(findings)} rule(s), {total_fail} instance(s) ===')
for rule, msgs in sorted(findings.items(), key=lambda kv: -len(kv[1])):
    print(f'\n  ✗ {rule}  ({len(msgs)})')
    for m in msgs[:4]:
        print(f'      {m[:150]}')
if not total_fail:
    print('  ✓ nothing found')
