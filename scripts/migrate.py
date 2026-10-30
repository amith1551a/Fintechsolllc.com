"""Migrate the recovered FintechSol static site into structured content for the Next.js app.

Reads the read-only recovery folder and writes:
  src/content/*.json        pages, posts, courses, categories, site chrome, homepage
  public/assets/<category>/  only the images/fonts the migrated content uses
  src/content/asset-map.json original URL -> public path (+ size)
  migration/report.json      everything skipped, unresolved or missing

Usage: python -I scripts/migrate.py <recovery_dir> <app_dir>
"""
import glob
import hashlib
import html
import json
import os
import posixpath
import re
import shutil
import sys
from collections import OrderedDict, defaultdict
from datetime import datetime
from urllib.parse import urlsplit, unquote

from bs4 import BeautifulSoup, Comment, NavigableString, Tag
from PIL import Image

REC = os.path.abspath(sys.argv[1])
APP = os.path.abspath(sys.argv[2])
CONTENT = os.path.join(APP, "src", "content")
PUBLIC = os.path.join(APP, "public")
ORIGIN = "https://fintechsolllc.com"
TITLE_SUFFIX = re.compile(r"\s*[–-]\s*(Page \d+\s*[–-]\s*)?Fintech Solllc\s*$")

report = defaultdict(list)
T0 = __import__("time").time()


def progress(*a):
    print(f"[{__import__('time').time() - T0:6.1f}s]", *a, flush=True)


def rec(*p):
    return os.path.join(REC, *p)


_soups = {}


def load(path):
    """Parse once per file (pages are read by several extractors)."""
    if path not in _soups:
        with open(path, encoding="utf-8") as fh:
            _soups[path] = BeautifulSoup(fh.read(), "lxml")
    return _soups[path]


def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip() if el else ""


# ------------------------------------------------------------------ routes
PAGES = json.load(open(rec("recovery-data", "pages.json"), encoding="utf-8"))
LOCAL_TO_PATH = {p["local_file"]: p["path"] for p in PAGES}
PATH_META = {p["path"]: p for p in PAGES}

COMPANY = ["/about-us-3/", "/services/", "/our-partners/", "/industry/", "/contact-us/", "/get-quote/",
           "/be-our-partner/"]
SERVICES = ["/global-startup-consulting-services/", "/mvp-development/", "/cybersecurity/",
            "/ai-blockchain-qa-and-automation-testing/", "/digital-marketing-strategy-and-campaign-execution/",
            "/shop/", "/back-office-and-fintech-solutions/", "/enterprise-it-cost-reduction-enterprise-reorganization/",
            "/real-estate-asset-management/"]
MORE = ["/assurance/", "/business-consulting/", "/compliance-solutions/", "/consulting/",
        "/cybersecurity-access-management/", "/cybersecurity-assessments/", "/it-services/",
        "/managed-service-provider/", "/rapid-prototyping/", "/tax/"]
LEGAL = ["/privacy-policy/", "/terms-of-service/", "/cancellation-and-refund-policy/"]
CONTENT_PAGES = COMPANY + [s for s in SERVICES if s != "/shop/"] + MORE + LEGAL

# recovered paths deliberately not migrated, with the reason (reported, never silently dropped)
EXCLUDE_RULES = [
    (r"^/(portfolio|project-cat|woodmart_slider)/", "WoodMart theme demo content (lorem ipsum / furniture demo)"),
    (r"^/tag/", "tag archives only contain WoodMart furniture demo tags (tags are kept on each article)"),
    (r"^/(home-furniture|sample-page|medical-services|build-new-digital-agency)/$", "WoodMart theme demo page"),
    (r"^/(cart|cart-2|cart-3|checkout|checkout-2|wishlist|compare|dashboard)/$", "WooCommerce/LMS function page; needs the original e-commerce backend"),
    (r"^/my-account/", "WooCommerce account page; needs the original backend"),
    (r"^/(student-registration|instructor-registration)/$", "LMS registration form shortcode only; needs the original backend"),
    (r"^/(free-tools|free-business-tools)/$", "login-restricted page; no content in the archive"),
    (r"^/author/", "author archive (only a WordPress listing of posts)"),
]
COMMERCE_REDIRECT = re.compile(r"^/(cart|cart-2|cart-3|checkout|checkout-2|wishlist|compare|my-account|dashboard)(/|$)")


def excluded(path):
    for pat, why in EXCLUDE_RULES:
        if re.search(pat, path):
            return why
    return None


def route_for(path):
    """Original path -> route in the new app (None if the target is not migrated)."""
    if path is None:
        return None
    m = re.match(r"^/(blog|shop)/page/(\d+)/$", path)
    if m:
        return path
    if re.match(r"^/(category|product-category)/[^/]+/(page/\d+/)?$", path):
        return path
    if path == "/" or path in CONTENT_PAGES or path in SERVICES or path == "/blog/":
        return path
    if re.match(r"^/\d{4}/\d{2}/\d{2}/[^/]+/$", path) or re.match(r"^/product/[^/]+/$", path):
        return path
    if COMMERCE_REDIRECT.match(path):
        return "/shop/"
    return None


# ------------------------------------------------------------------ assets
ASSET_MAP = OrderedDict()  # source abs path -> {"src","width","height","original"}
ASSETS_JSON = {a["local_file"]: a for a in json.load(open(rec("recovery-data", "assets.json"), encoding="utf-8"))}
IMG_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"}
SIZE_RE = re.compile(r"-(\d+)x(\d+)(\.\w+)$")


def original_url_for(abs_local):
    relp = os.path.relpath(abs_local, REC).replace(os.sep, "/")
    a = ASSETS_JSON.get(relp)
    return a["original_url"] if a else None


def local_candidates(url, base_dir):
    """Turn an img URL (relative recovery path or absolute original URL) into a local file path guess."""
    if not url or url.startswith("data:"):
        return None
    p = urlsplit(url)
    if p.scheme in ("http", "https"):
        if "fintechsolllc.com" not in p.netloc:
            return None
        path = unquote(p.path)
        if not path.startswith("/wp-content/uploads/"):
            return None
        sub = path[len("/wp-content/uploads/"):]
        for cat in ("images", "logos", "icons", "banners", "media"):
            cand = rec("assets", cat, "uploads", *sub.split("/"))
            if os.path.exists(cand):
                return cand
        return rec("assets", "images", "uploads", *sub.split("/"))  # may not exist; caller tries variants
    return os.path.normpath(os.path.join(base_dir, unquote(p.path)))


_listings = {}


def find_variant(path):
    """Best recovered size of the same upload (largest), so one image is published once at top quality."""
    d, name = os.path.split(path)
    if not SIZE_RE.search(name) and os.path.exists(path):
        return path  # the original upload itself
    m = SIZE_RE.search(name)
    stem, ext = (name[:m.start()], m.group(3)) if m else os.path.splitext(name)
    hits = []
    for cat in ("images", "logos", "icons", "banners"):
        dd = d.replace(os.sep + "images" + os.sep, os.sep + cat + os.sep)
        if dd not in _listings:
            _listings[dd] = os.listdir(dd) if os.path.isdir(dd) else []
        for f in _listings[dd]:
            if f == stem + ext or (f.startswith(stem + "-") and SIZE_RE.search(f) and f[:SIZE_RE.search(f).start()] == stem
                                   and f.endswith(ext)):
                hits.append(os.path.join(dd, f))
    if not hits:
        return path if os.path.exists(path) else None
    return max(hits, key=lambda f: os.path.getsize(f))


def publish_asset(src_abs, category, original=None):
    """Copy a recovered file into public/assets/<category>/ once; return its public info."""
    if src_abs in ASSET_MAP:
        return ASSET_MAP[src_abs]
    relp = os.path.relpath(src_abs, REC).replace(os.sep, "/")
    m = re.search(r"uploads/(\d{4})/(\d{2})/(.+)$", relp)
    name = f"{m.group(1)}-{m.group(2)}-{m.group(3).replace('/', '-')}" if m else os.path.basename(relp)
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).lower()
    dest_rel = f"assets/{category}/{name}"
    dest = os.path.join(PUBLIC, *dest_rel.split("/"))
    if os.path.exists(dest) and dest_rel not in {v["src"].lstrip("/") for v in ASSET_MAP.values()}:
        pass  # leftover from a previous run: overwrite below
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copyfile(src_abs, dest)
    w = h = None
    if os.path.splitext(name)[1] in IMG_EXT - {".svg", ".ico"}:
        try:
            with Image.open(src_abs) as im:
                w, h = im.size
        except Exception as e:  # corrupted file: report, don't use
            report["corrupt_images"].append({"file": relp, "error": repr(e)})
            os.remove(dest)
            return None
    info = {"src": "/" + dest_rel, "width": w, "height": h,
            "original": original or original_url_for(src_abs), "recovered_file": relp}
    ASSET_MAP[src_abs] = info
    return info


def image(url, base_file, category, alt="", page=None, srcset=None):
    """Resolve an <img> reference to a published local asset (or None, recorded as missing)."""
    base_dir = os.path.dirname(rec(base_file))
    cands = [url] + [c.strip().split()[0] for c in (srcset or "").split(",") if c.strip()]
    for u in cands:
        lp = local_candidates(u, base_dir)
        if not lp:
            continue
        found = find_variant(lp)
        if found and os.path.splitext(found)[1].lower() in IMG_EXT:
            orig = u if u.startswith("http") else original_url_for(found)
            info = publish_asset(found, category, orig)
            if info:
                return dict(info, alt=alt)
    if url and not url.startswith("data:"):
        report["missing_images"].append({"page": page or base_file, "image": url if url.startswith("http") else
                                         (original_url_for(os.path.normpath(os.path.join(base_dir, url))) or url)})
    return None


def img_attrs(img):
    src = img.get("src") or ""
    if src.startswith("data:") or not src:
        src = img.get("data-src") or img.get("data-lazy-src") or ""
    return src, img.get("srcset") or img.get("data-srcset"), (img.get("alt") or "").strip()


# ------------------------------------------------------------------ links
def map_href(href, base_file, page):
    href = (href or "").strip()
    if not href or href == "#" or href.startswith("javascript:"):
        return None
    if href.startswith(("mailto:", "tel:")):
        return href
    if href.startswith("#"):
        return href
    p = urlsplit(href)
    frag = f"#{p.fragment}" if p.fragment and not p.fragment.startswith("respond") else ""
    if p.scheme in ("http", "https"):
        if "fintechsolllc.com" in p.netloc:
            path = unquote(p.path) or "/"
            if not path.endswith("/") and "." not in posixpath.basename(path):
                path += "/"
            r = route_for(path)
            if r:
                return r + frag
            report["unresolved_links"].append({"page": page, "href": href, "reason": excluded(path) or "target not recovered"})
            return None
        if "web.archive.org" in p.netloc:
            m = re.search(r"/web/\d+[a-z_]*/(https?://.*)$", href)
            return map_href(m.group(1), base_file, page) if m else None
        return href
    target = os.path.normpath(os.path.join(os.path.dirname(rec(base_file)), unquote(p.path)))
    relp = os.path.relpath(target, REC).replace(os.sep, "/")
    if relp in LOCAL_TO_PATH:
        r = route_for(LOCAL_TO_PATH[relp])
        if r:
            return r + frag
        report["unresolved_links"].append({"page": page, "href": LOCAL_TO_PATH[relp],
                                           "reason": excluded(LOCAL_TO_PATH[relp]) or "not migrated"})
        return None
    if relp.startswith("assets/") and os.path.exists(target):
        ext = os.path.splitext(target)[1].lower()
        info = publish_asset(target, "images" if ext in IMG_EXT else "media")
        return info["src"] if info else None
    report["unresolved_links"].append({"page": page, "href": href, "reason": "unknown local target"})
    return None


# ------------------------------------------------------------------ HTML cleaning
BLOCK = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "table", "thead", "tbody",
         "tr", "td", "th", "figure", "figcaption", "pre", "hr", "div", "section", "article", "details", "summary"}
KEEP = {"p", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "em", "a", "br", "blockquote", "table",
        "thead", "tbody", "tr", "td", "th", "sup", "sub", "code", "pre", "hr", "figure", "figcaption"}
RENAME = {"b": "strong", "i": "em", "h1": "h2"}
DROP = {"script", "style", "noscript", "svg", "form", "input", "button", "select", "textarea", "iframe", "video",
        "audio", "canvas", "link", "meta", "label"}


class Ctx:
    def __init__(self, base_file, page, img_category):
        self.base_file, self.page, self.cat = base_file, page, img_category


def esc(s):
    return html.escape(s, quote=False)


def ser(node, ctx):
    """Serialize a node to sanitized HTML."""
    if isinstance(node, Comment):
        return ""
    if isinstance(node, NavigableString):
        return esc(str(node))
    if not isinstance(node, Tag):
        return ""
    name = node.name
    if name in DROP:
        return ""
    if name == "i" and (not node.get_text(strip=True) or any(c.startswith(("fa", "icon", "wd-icon", "e-font")) for c in node.get("class", []))):
        return ""
    if name == "img":
        src, srcset, alt = img_attrs(node)
        info = image(src, ctx.base_file, ctx.cat, alt, ctx.page, srcset)
        if not info:
            return ""
        wh = f' width="{info["width"]}" height="{info["height"]}"' if info["width"] else ""
        return f'<img src="{info["src"]}" alt="{html.escape(alt)}"{wh} loading="lazy">'
    name = RENAME.get(name, name)
    if name in BLOCK and name not in KEEP and name not in ("td", "th"):
        return wrap_loose(node, ctx)  # before serialising children: doing both is 2^depth
    inner = "".join(ser(c, ctx) for c in node.children)
    if name == "a":
        href = map_href(node.get("href"), ctx.base_file, ctx.page)
        if not href or not inner.strip():
            return inner
        ext = href.startswith("http")
        return f'<a href="{html.escape(href)}"{" rel=\"noopener noreferrer\" target=\"_blank\"" if ext else ""}>{inner}</a>'
    if name in ("td", "th"):
        span = "".join(f' {k}="{node[k]}"' for k in ("colspan", "rowspan") if node.has_attr(k))
        return f"<{name}{span}>{inner}</{name}>"
    if name in ("br", "hr"):
        return f"<{name}>"
    if name in KEEP:
        if name in ("p", "li", "h2", "h3", "h4", "h5", "h6", "figcaption", "blockquote") and not re.sub(r"<br>|&nbsp;|\s", "", inner):
            return ""
        return f"<{name}>{inner.strip()}</{name}>"
    return inner  # span, font, etc.: unwrap


_has_block = {}


def has_block(el):
    """Whether el contains a block-level descendant (memoised: subtree scans per level are quadratic)."""
    k = id(el)
    if k not in _has_block:
        _has_block[k] = any(isinstance(c, Tag) and (c.name in BLOCK or has_block(c)) for c in el.children)
    return _has_block[k]


def wrap_loose(node, ctx):
    """Unwrap a block container, wrapping loose inline runs in <p>."""
    out, run = [], []

    def flush():
        s = "".join(run).strip()
        if re.sub(r"<[^>]+>|&nbsp;|\s", "", s):
            out.append(f"<p>{s}</p>")
        run.clear()
    for c in node.children:
        is_block = isinstance(c, Tag) and (c.name in BLOCK or c.name == "img" or c.name in DROP or
                                           (c.name != "a" and has_block(c)))
        if is_block:
            flush()
            out.append(ser(c, ctx))
        else:
            run.append(ser(c, ctx))
    flush()
    return "\n".join(o for o in out if o)


def clean(el, ctx):
    return wrap_loose(el, ctx) if el else ""


# ------------------------------------------------------------------ Elementor conversion
SKIP_WIDGETS = {"divider", "social-icons", "nav-menu", "form", "google_maps", "wd_blog", "wd_products",
                "wd_product_categories", "wd_products_brands", "wd_countdown_timer", "wd_slider", "wd_social_buttons",
                "icon", "spacer", "wd_video", "video", "html", "wp-widget-search"}


def is_container(el):
    cls = el.get("class", [])
    return el.name in ("section", "div") and ("e-con" in cls or "elementor-section" in cls or "elementor-column" in cls
                                              or "elementor-container" in cls or "elementor-widget-wrap" in cls
                                              or "e-con-inner" in cls or "elementor-row" in cls or "elementor-inner-section" in cls)


def heading_html(tag_name, txt_html, plain):
    lvl = int(tag_name[1]) if re.fullmatch(r"h[1-6]", tag_name or "") else 3
    lvl = max(2, lvl)
    if len(plain) > 95:  # long sentence styled as a heading in Elementor: keep as lead text
        return f'<p class="lead">{txt_html}</p>'
    return f"<h{lvl}>{txt_html}</h{lvl}>"


def card(ctx, title="", body="", img=None, href=None, kind="card"):
    parts = []
    if img:
        info = image(img[0], ctx.base_file, ctx.cat, img[1], ctx.page, img[2] if len(img) > 2 else None)
        if info:
            wh = f' width="{info["width"]}" height="{info["height"]}"' if info["width"] else ""
            parts.append(f'<img src="{info["src"]}" alt="{html.escape(img[1] or title)}"{wh} loading="lazy">')
    if title:
        t = f'<a href="{html.escape(href)}">{esc(title)}</a>' if href else esc(title)
        parts.append(f"<h3>{t}</h3>")
    if body:
        parts.append(body)
    if not title and not body:
        return None
    return (kind, f'<div class="{kind}">' + "".join(parts) + "</div>")


def first_img(el):
    i = el.find("img")
    return img_attrs(i) if i else None


def render_widget(w, ctx):
    wt = w.get("data-widget_type", "").split(".")[0]
    c = w.select_one(".elementor-widget-container") or w
    if wt == "wd_blog":  # post grid: keep which posts it showed, rendered with BlogCard
        paths = []
        for a in c.select(".wd-entities-title a, h3 a"):
            r = map_href(a.get("href"), ctx.base_file, ctx.page)
            if r and re.match(r"^/\d{4}/", r) and r not in paths:
                paths.append(r)
        return [("posts", {"paths": paths})] if paths else []
    if wt == "form":  # Elementor form: replaced by the app's validated form of the same purpose
        labels = [text(l) for l in c.select("label")]
        kind = "quote" if any("Budget" in l for l in labels) else "partner" if any("Website" in l for l in labels) else "contact"
        report["forms"].append({"page": ctx.page, "kind": kind, "fields": labels})
        return [("form", {"form": kind})]
    if wt in SKIP_WIDGETS:
        if wt in ("form", "wd_blog", "wd_products", "wd_slider", "wd_video", "video", "google_maps", "shortcode"):
            report["skipped_widgets"].append({"page": ctx.page, "widget": wt, "text": text(c)[:120]})
        return []
    if wt in ("heading", "rs-heading"):
        h = c.find(re.compile(r"^h[1-6]$")) or c.find(class_="elementor-heading-title") or c
        inner = "".join(ser(x, ctx) for x in h.children).strip()
        return [("block", heading_html(h.name, inner, text(h)))] if text(h) else []
    if wt == "wd_title":
        out = []
        sub = c.select_one(".title-subtitle")
        t = c.select_one(".woodmart-title-container, .title")
        after = c.select_one(".title-after_title")
        if sub and text(sub):
            out.append(("block", f'<p class="eyebrow">{esc(text(sub))}</p>'))
        if t and text(t):
            out.append(("block", heading_html(t.name, esc(text(t)), text(t))))
        if after and text(after):
            out.append(("block", f"<p>{esc(text(after))}</p>"))
        return out
    if wt in ("text-editor", "wd_text_block"):
        h = clean(c, ctx)
        return [("block", h)] if h.strip() else []
    if wt in ("icon-box", "image-box", "wd_infobox"):
        title_el = c.select_one(".elementor-icon-box-title, .elementor-image-box-title, .info-box-title, .wd-info-box-title")
        desc_el = c.select_one(".elementor-icon-box-description, .elementor-image-box-description, .info-box-inner, .wd-info-box-desc")
        a = c.find("a", href=True)
        href = map_href(a["href"], ctx.base_file, ctx.page) if a else None
        res = card(ctx, text(title_el), clean(desc_el, ctx) if desc_el else "", first_img(c), href)
        return [res] if res else []
    if wt == "wd_infobox_carousel":
        out = []
        for box in c.select(".info-box-wrapper, .wd-info-box"):
            title_el = box.select_one(".info-box-title, .wd-info-box-title")
            desc_el = box.select_one(".info-box-inner, .wd-info-box-desc")
            res = card(ctx, text(title_el), clean(desc_el, ctx) if desc_el else "", first_img(box))
            if res:
                out.append(res)
        return out
    if wt == "wd_team_member":
        name = c.select_one(".member-name")
        pos = c.select_one(".member-position")
        bio = c.select_one(".member-bio")
        body = (f'<p class="eyebrow">{esc(text(pos))}</p>' if pos and text(pos) else "") + (clean(bio, ctx) if bio else "")
        res = card(ctx, text(name), body, first_img(c))
        return [res] if res else []
    if wt in ("image", "wd_image_or_svg"):
        i = c.find("img")
        if not i:
            return []
        src, srcset, alt = img_attrs(i)
        info = image(src, ctx.base_file, ctx.cat, alt, ctx.page, srcset)
        if not info:
            return []
        wh = f' width="{info["width"]}" height="{info["height"]}"' if info["width"] else ""
        cap = c.find("figcaption")
        capt = f"<figcaption>{esc(text(cap))}</figcaption>" if cap and text(cap) else ""
        return [("image", f'<figure><img src="{info["src"]}" alt="{html.escape(alt)}"{wh} loading="lazy">{capt}</figure>')]
    if wt in ("button", "wd_button"):
        a = c.find("a", href=True)
        label = text(a) if a else ""
        href = map_href(a["href"], ctx.base_file, ctx.page) if a else None
        if a and label and href:
            return [("button", f'<p class="actions"><a class="btn" href="{html.escape(href)}">{esc(label)}</a></p>')]
        if label:
            report["dropped_buttons"].append({"page": ctx.page, "label": label, "href": a.get("href") if a else None})
        return []
    if wt == "icon-list":
        items = []
        for li in c.select(".elementor-icon-list-item"):
            t = li.select_one(".elementor-icon-list-text") or li
            a = li.find("a", href=True)
            href = map_href(a["href"], ctx.base_file, ctx.page) if a else None
            items.append(f'<li><a href="{html.escape(href)}">{esc(text(t))}</a></li>' if href else f"<li>{esc(text(t))}</li>")
        return [("block", "<ul>" + "".join(items) + "</ul>")] if items else []
    if wt == "nested-accordion":
        out = []
        for d in c.select("details"):
            summ = d.find("summary")
            title = text(summ.select_one(".e-n-accordion-item-title-text") or summ) if summ else ""
            body = group(render_children(d, ctx, skip=summ))
            out.append(f"<details><summary>{esc(title)}</summary>{body}</details>")
        return [("block", '<div class="accordion">' + "".join(out) + "</div>")] if out else []
    if wt == "nested-tabs":
        titles = [text(t) for t in c.select(".e-n-tab-title")]
        panes = c.select(".e-n-tabs-content > *")
        out = []
        for i, pane in enumerate(panes):
            t = titles[i] if i < len(titles) else ""
            body = group(render_children(pane, ctx))
            out.append((f"<h3>{esc(t)}</h3>" if t else "") + body)
        return [("block", "\n".join(out))] if out else []
    if wt == "counter":
        num = c.select_one(".elementor-counter-number")
        val = (num.get("data-to-value") if num else "") or text(num)
        pre = text(c.select_one(".elementor-counter-number-prefix"))
        suf = text(c.select_one(".elementor-counter-number-suffix"))
        ttl = text(c.select_one(".elementor-counter-title"))
        return [("stat", f'<div class="stat"><strong>{esc(pre + val + suf)}</strong><span>{esc(ttl)}</span></div>')]
    if wt == "wd_banner":
        body = clean(c.select_one(".banner-inner, .wrapper-content-banner, .content-banner"), ctx)
        res = card(ctx, text(c.select_one(".banner-title")), body, first_img(c))
        return [res] if res else []
    if wt in ("image-carousel", "gallery", "wd_images_gallery"):
        figs = []
        for i in c.find_all("img"):
            src, srcset, alt = img_attrs(i)
            info = image(src, ctx.base_file, ctx.cat, alt, ctx.page, srcset)
            if info and info["src"] not in "".join(figs):
                wh = f' width="{info["width"]}" height="{info["height"]}"' if info["width"] else ""
                figs.append(f'<figure><img src="{info["src"]}" alt="{html.escape(alt)}"{wh} loading="lazy"></figure>')
        return [("block", '<div class="gallery">' + "".join(figs) + "</div>")] if figs else []
    if wt == "wd_testimonials":
        out = []
        for t in c.select(".testimonial"):
            body = clean(t.select_one(".testimonial-content > *:not(footer), .testimonial-text") or t, ctx)
            who = text(t.select_one(".testimonial-name, footer"))
            out.append(f'<blockquote>{body}{f"<cite>{esc(who)}</cite>" if who else ""}</blockquote>')
        return [("block", "".join(out))] if out else []
    # unknown widget: keep its readable content
    h = clean(c, ctx)
    if h.strip():
        report["generic_widgets"].append({"page": ctx.page, "widget": wt})
        return [("block", h)]
    return []


def render_children(el, ctx, skip=None):
    kids = [k for k in el.children if isinstance(k, Tag) and k is not skip]
    parts = []  # rendered once per child (re-rendering nested containers is exponential)
    for k in kids:
        if k.has_attr("data-widget_type"):
            parts.append(render_widget(k, ctx))
        elif is_container(k) or k.name in ("div", "section"):
            parts.append(render_children(k, ctx))
        elif k.name not in DROP:
            h = ser(k, ctx)
            parts.append([("block", h)] if h.strip() else [])
        else:
            parts.append([])
    items = [x for p in parts for x in p]
    # two-column container with an image on one side: keep the side-by-side layout
    if len(kids) == 2 and all(is_container(k) for k in kids):
        a, b = parts
        only_img = lambda xs: xs and all(k == "image" for k, _ in xs)
        if (only_img(a) and b and not only_img(b)) or (only_img(b) and a and not only_img(a)):
            return [("block", f'<div class="split"><div>{group(a)}</div><div>{group(b)}</div></div>')]
    return items


def group_parts(items):
    """Turn rendered items into section parts: html (cards/stats wrapped in grids), post lists, form slots."""
    parts, html_buf, run, kind = [], [], [], None

    def flush_run():
        nonlocal kind
        if run:
            cls = "stats" if kind == "stat" else "cards"
            html_buf.append(f'<div class="{cls}">' + "".join(run) + "</div>")
            run.clear()
        kind = None

    def flush_html():
        flush_run()
        h = "\n".join(x for x in html_buf if x)
        if re.sub(r"<[^>]+>|\s", "", h) or "<img" in h:
            parts.append({"type": "html", "html": h})
        html_buf.clear()
    for k, h in items:
        if k in ("card", "stat"):
            if kind != k:
                flush_run()
            kind = k
            if h not in run:  # carousels clone slides; responsive variants repeat cards
                run.append(h)
        elif k in ("posts", "form"):
            flush_html()
            parts.append({"type": k, **h})
        else:
            flush_run()
            html_buf.append(h)
    flush_html()
    return parts


def group(items):
    """Items -> one HTML string (post lists and forms are not representable inline and are dropped)."""
    return "\n".join(p["html"] for p in group_parts(items) if p["type"] == "html")


def elementor_root(soup):
    main = soup.find("main") or soup.body
    for el in main.select(".elementor[data-elementor-type]"):
        if el.get("data-elementor-type") in ("wp-page", "wp-post", "single-post", "single-page", "product"):
            return el
    for el in main.select(".elementor"):
        if "elementor-location-header" not in el.get("class", []) and "elementor-location-footer" not in el.get("class", []):
            return el
    return None


HEADING_ONLY = re.compile(r"^\s*<h[2-6]>[^<]*</h[2-6]>\s*$")


def convert_sections(root, ctx):
    """Top-level Elementor containers -> sections, each a list of parts (html / posts / form)."""
    sections, pending = [], None
    for top in [k for k in root.children if isinstance(k, Tag)]:
        items = render_widget(top, ctx) if top.has_attr("data-widget_type") else render_children(top, ctx)
        parts = group_parts(items)
        if not parts:
            continue
        if len(parts) == 1 and parts[0]["type"] == "html" and HEADING_ONLY.match(parts[0]["html"]):
            if not sections and pending is None:
                # opening banner title: repeats the page title rendered as the H1
                report["banner_titles_dropped"].append({"page": ctx.page, "html": parts[0]["html"]})
            else:
                pending = parts[0]["html"]  # Elementor heading container: belongs to the next section
            continue
        if pending:
            if parts[0]["type"] == "html":
                parts[0] = {"type": "html", "html": pending + "\n" + parts[0]["html"]}
            else:
                parts.insert(0, {"type": "html", "html": pending})
            pending = None
        sections.append(parts)
    if pending:
        report["trailing_headings_dropped"].append({"page": ctx.page, "html": pending})
    return sections


def html_of(sections):
    return [p["html"] for s in sections for p in s if p["type"] == "html"]


def clip(t, n=158):
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= n else t[:n - 3].rsplit(" ", 1)[0].rstrip(",;:—–- ") + "…"


def description(htmls, fallback=""):
    for h in htmls:
        for m in re.finditer(r"<p(?: class=\"lead\")?>(.*?)</p>", h, re.S):
            t = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
            if len(re.sub(r"\s+", " ", t)) >= 70:
                return clip(t)
    return clip(fallback)


def page_title(soup, path):
    t = soup.title.get_text(strip=True) if soup.title else ""
    t = TITLE_SUFFIX.sub("", t).strip()
    return t or path.strip("/").replace("-", " ").title()


# ------------------------------------------------------------------ site chrome
def extract_site():
    soup = load(rec("index.html"))
    header = soup.find("header")
    menu = header.select_one("ul.menu, ul.wd-nav")
    report_ctx = "site-header"

    def walk(ul):
        items = []
        for li in ul.find_all("li", recursive=False):
            a = li.find("a")
            href = map_href(a.get("href"), "index.html", report_ctx)
            sub = li.find("ul")
            label = text(a)
            if not href:
                report["nav_removed"].append({"label": label, "href": a.get("href"),
                                              "reason": "target page not migrated (login-restricted, no archived content)"})
                continue
            items.append({"label": label, "href": href, **({"children": walk(sub)} if sub else {})})
        return items
    nav = walk(menu)
    footer = soup.select_one(".elementor-location-footer")
    logo = publish_asset(rec("assets", "logos", "uploads", "2025", "03", "logo.jpg"), "logos")
    logo_png = publish_asset(rec("assets", "logos", "uploads", "2025", "03", "logo-no-bg.png"), "logos")
    social = []
    for a in footer.find_all("a", href=True):
        h = a["href"]
        for net in ("instagram", "facebook", "youtube", "linkedin"):
            if net in h and not any(s["network"] == net for s in social):
                # the recovered LinkedIn link is the company-admin dashboard; visitors need the public page
                social.append({"network": net, "href": re.sub(r"/admin/.*$", "/", h)})
    ftxt = text(footer)
    about = re.search(r"FinTech Solutions\s+(delivers .*?operations\.)", ftxt)
    useful = []
    for a in footer.find_all("a", href=True):
        if text(a) in ("Cancellation and Refund Policy", "Privacy Policy", "Terms of Service") and \
                not any(u["label"] == text(a) for u in useful):
            useful.append({"label": text(a), "href": map_href(a["href"], "index.html", "site-footer")})
    copyright_ = re.search(r"(. Fintech Solutions . 2025 All Rights Reserved\.)", ftxt)
    return {
        "name": "Fintech Solutions LLC",
        "shortName": "FinTech Solutions",
        "tagline": page_title(soup, "/").split("–")[-1].strip() if "–" in page_title(soup, "/") else "",
        "homeTitle": page_title(soup, "/"),
        "logo": logo, "logoTransparent": logo_png,
        "nav": nav,
        "ctaLabel": "Get Quote", "ctaHref": "/get-quote/",
        "footerAbout": "FinTech Solutions " + about.group(1) if about else "",
        "usefulLinks": useful,
        "contact": {
            "address": "7247 marquis ln, irving, tx , 75063",
            "phone": "+1(682-434-9964)", "phoneHref": "tel:+16824349964",
            "email": "amith@fintechsolllc.com",
        },
        "social": social,
        "copyright": copyright_.group(1).replace("�", "©").replace("�", "©") if copyright_ else "",
        "source": "recovered homepage header/footer (capture 20260711000045)",
    }


# ------------------------------------------------------------------ pages
def extract_page(path, img_cat):
    meta = PATH_META[path]
    lf = meta["local_file"]
    soup = load(rec(lf))
    ctx = Ctx(lf, path, img_cat)
    root = elementor_root(soup)
    if root is not None and root.find(attrs={"data-widget_type": True}):
        sections = convert_sections(root, ctx)
    else:
        body = (soup.find("main") or soup.body).select_one("article .entry-content, .wd-entry-content, .entry-content")
        sections = [[{"type": "html", "html": clean(body, ctx)}]] if body else []
    title = page_title(soup, path)
    htmls = html_of(sections)
    # no long paragraph to quote: fall back to the page's own headings (still original text)
    heads = [html.unescape(re.sub(r"<[^>]+>", "", m)) for h in htmls for m in re.findall(r"<h[23]>(.*?)</h[23]>", h)]
    fallback = f"{title}: " + ", ".join(dict.fromkeys(heads[1:8])) if len(heads) > 1 else ""
    return {"path": path, "title": title, "description": description(htmls, fallback),
            "sections": sections, "capture": meta["capture_ts"], "archiveUrl": meta["archive_url"],
            "recoveredFile": lf}


# ------------------------------------------------------------------ blog
def parse_date(s):
    s = re.sub(r"^(On|Posted on)\s+", "", (s or "").strip())
    for fmt in ("%B %d, %Y", "%d %B %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def listing_cards(local_file):
    """Posts shown on a listing page: href(route) -> thumbnail img attrs + excerpt."""
    soup = load(rec(local_file))
    out = OrderedDict()
    for art in (soup.find("main") or soup.body).select("article.wd-post, .wd-post, article.blog-design-masonry, article"):
        a = art.select_one(".wd-entities-title a, h3 a, .post-title a")
        if not a:
            continue
        r = map_href(a["href"], local_file, local_file)
        if not r or r in out:
            continue
        img = art.find("img")
        cats = [text(c) for c in art.select(".wd-post-cat a, .meta-post-categories a")]
        out[r] = {"img": img_attrs(img) if img else None, "categories": cats}
    return out


def extract_categories():
    cats = OrderedDict()
    for p in PAGES:
        m = re.match(r"^/category/([^/]+)/(?:page/(\d+)/)?$", p["path"])
        if not m:
            continue
        slug = m.group(1)
        soup = load(rec(p["local_file"]))
        name = page_title(soup, p["path"])
        c = cats.setdefault(slug, {"slug": slug, "name": name, "posts": [], "pages_recovered": []})
        c["pages_recovered"].append(p["path"])
        for r, info in listing_cards(p["local_file"]).items():
            if r not in c["posts"]:
                c["posts"].append(r)
    return cats


def extract_posts(cats):
    thumbs = {}
    for lf in ["index.html", "pages/partners.html", "blog/index.html"] + \
              [p["local_file"] for p in PAGES if re.match(r"^/(blog/page|category)/", p["path"])]:
        for r, info in listing_cards(lf).items():
            if info["img"] and r not in thumbs:
                thumbs[r] = (info["img"], lf)
    slug_to_name = {s: c["name"] for s, c in cats.items()}
    partner_posts = set(cats.get("our-partners", {}).get("posts", []))  # their images are partner logos
    posts = []
    for p in PAGES:
        m = re.match(r"^/(\d{4})/(\d{2})/(\d{2})/([^/]+)/$", p["path"])
        if not m:
            continue
        path, lf = p["path"], p["local_file"]
        progress("post", path)
        soup = load(rec(lf))
        img_cat = "partners" if path in partner_posts else "blog"
        ctx = Ctx(lf, path, img_cat)
        art = soup.select_one("article.post-single-page")
        url_date = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
        tags, cat_names, author, date, featured = [], [], None, None, None
        if art is not None:
            title = text(art.select_one("h1.wd-entities-title, h1"))
            date = parse_date(text(art.select_one(".wd-meta-date")))
            au = text(art.select_one(".wd-meta-author"))
            author = re.sub(r"^Posted by\s+", "", au) or None
            classes = art.get("class", [])
            cat_slugs = [c[len("category-"):] for c in classes if c.startswith("category-")]
            cat_names = [slug_to_name.get(s, s.replace("-", " ").title()) for s in cat_slugs]
            tag_slugs = [c[len("tag-"):] for c in classes if c.startswith("tag-")]
            tag_links = {a.get_text(strip=True) for a in art.select(".wd-tags-list a, .tags-list a")}
            tags = sorted(tag_links) if tag_links else [t.replace("-", " ").title() for t in tag_slugs]
            fi = art.select_one(".wd-single-post-img img")
            if fi:
                src, srcset, alt = img_attrs(fi)
                featured = image(src, lf, img_cat, alt or title, path, srcset)
            content = art.select_one(".wd-entry-content")
            if content is not None and content.select_one(".elementor[data-elementor-type], .elementor"):
                root = content.select_one(".elementor")
                sections = html_of(convert_sections(root, ctx))
            else:
                sections = [clean(content, ctx)] if content else []
        else:
            title = page_title(soup, path)
            root = elementor_root(soup)
            sections = html_of(convert_sections(root, ctx)) if root is not None else []
            cat_slugs = [s for s, c in cats.items() if path in c["posts"]]
            cat_names = [slug_to_name[s] for s in cat_slugs]
        if not cat_names:
            cat_slugs = [s for s, c in cats.items() if path in c["posts"]]
            cat_names = [slug_to_name[s] for s in cat_slugs]
        if featured is None and path in thumbs:
            (src, srcset, alt), from_lf = thumbs[path]
            featured = image(src, from_lf, img_cat, alt or title, path, srcset)
        if featured is None:
            report["posts_without_featured_image"].append(path)
        sections = [s for s in sections if re.sub(r"<[^>]+>|\s", "", s)]
        body = "\n".join(sections)
        if len(re.sub(r"<[^>]+>", "", body).split()) < 40:
            report["thin_posts"].append({"path": path, "words": len(re.sub(r"<[^>]+>", "", body).split())})
        posts.append({
            "path": path, "year": m.group(1), "month": m.group(2), "day": m.group(3), "slug": m.group(4),
            "title": title, "date": date or url_date, "urlDate": url_date, "author": author,
            "categories": [{"slug": s, "name": n} for s, n in zip(cat_slugs, cat_names)],
            "tags": tags, "featuredImage": featured, "html": body,
            "description": description(sections, title),
            "capture": p["capture_ts"], "archiveUrl": p["archive_url"], "recoveredFile": lf,
        })
    posts.sort(key=lambda x: (x["date"], x["path"]), reverse=True)
    return posts


# ------------------------------------------------------------------ IT training catalog
LOREM = re.compile(r"\b(lorem|ipsum|henectus|tincidunt|vestibulum|pulvinar|suspendisse|parturient|bibendum|"
                   r"ullamcorper|sollicitudin|venenatis|phasellus|imperdiet|nontin|mauris|dignis|netus)\b", re.I)


def extract_courses():
    order = []
    for n in [""] + [f"/page-{i}" for i in range(2, 12)]:
        lf = "pages/services/it-training" + (n.replace("/page-", "/page-") if n else "") + ".html"
        if not os.path.exists(rec(lf)):
            continue
        soup = load(rec(lf))
        for a in (soup.find("main") or soup.body).select(".wd-entities-title a, .product-title a, h3 a"):
            r = map_href(a["href"], lf, lf)
            if r and r.startswith("/product/") and r not in order:
                order.append(r)
    pcats = OrderedDict()
    for p in PAGES:
        m = re.match(r"^/product-category/([^/]+)/(?:page/(\d+)/)?$", p["path"])
        if not m:
            continue
        soup = load(rec(p["local_file"]))
        c = pcats.setdefault(m.group(1), {"slug": m.group(1), "name": page_title(soup, p["path"]), "courses": []})
        for a in (soup.find("main") or soup.body).select(".wd-entities-title a, .product-title a"):
            r = map_href(a["href"], p["local_file"], p["path"])
            if r and r.startswith("/product/") and r not in c["courses"]:
                c["courses"].append(r)
    courses = []
    for p in PAGES:
        m = re.match(r"^/product/([^/]+)/$", p["path"])
        if not m:
            continue
        path, lf = p["path"], p["local_file"]
        soup = load(rec(lf))
        ctx = Ctx(lf, path, "services")
        title = text(soup.select_one(".product_title")) or page_title(soup, path)
        if LOREM.search(title):
            report["excluded_demo_courses"].append({"path": path, "title": title})
            continue
        price_el = soup.select_one(".summary .price, .price")
        price = None
        if price_el:
            sr = price_el.select_one(".screen-reader-text")
            if sr:
                sr.decompose()
            price = re.sub(r"\$\s+", "$", text(price_el)).replace("�", "–").replace(" � ", " – ")
        short = soup.select_one(".woocommerce-product-details__short-description")
        desc = soup.select_one("#tab-description, .woocommerce-Tabs-panel--description")
        if desc is not None:
            for h in desc.select("h2"):
                if text(h).lower() == "description":
                    h.decompose()
        packages = [o.get_text(strip=True) for o in soup.select("form.cart select option") if o.get("value")]
        gi = soup.select_one(".woocommerce-product-gallery img")
        img = None
        if gi:
            src, srcset, alt = img_attrs(gi)
            src = gi.get("data-large_image") or src
            img = image(src, lf, "services", alt or title, path, srcset)
        cats = [{"slug": s, "name": c["name"]} for s, c in pcats.items() if path in c["courses"]]
        body = clean(desc, ctx) if desc else ""
        courses.append({"path": path, "slug": m.group(1), "title": title, "price": price,
                        "shortDescription": clean(short, ctx) if short else "", "html": body,
                        "packages": packages, "image": img, "categories": cats,
                        "description": description([clean(short, ctx) if short else "", body], title),
                        "capture": p["capture_ts"], "archiveUrl": p["archive_url"], "recoveredFile": lf})
    known = {c["path"] for c in courses}
    order = [o for o in order if o in known] + sorted(known - set(order))
    courses.sort(key=lambda c: order.index(c["path"]))
    for c in pcats.values():
        c["courses"] = [x for x in c["courses"] if x in known]
    return courses, [c for c in pcats.values() if c["courses"]]


# ------------------------------------------------------------------ homepage + structured extras
def extract_home():
    soup = load(rec("index.html"))
    ctx = Ctx("index.html", "/", "banners")
    sec = lambda did: soup.select_one(f'[data-id="{did}"]')
    hero = sec("78762ea")
    services = []
    for a in sec("388e103").select("h2 a"):
        services.append({"title": text(a), "href": map_href(a["href"], "index.html", "/")})
    labs = sec("513be8a")
    labs_img = labs.find("img")
    cert = sec("bf092da").find("img")
    insights = list(listing_cards("index.html").keys())
    return {
        "hero": {"eyebrow": text(hero.find("h4")), "text": text(hero.find("p"))},
        "whyChoose": {"heading": text(sec("1046f26").find("h2")).replace(" ?", "?"), "buttonLabel": "Learn More"},
        "servicesHeading": text(sec("388e103").find("h2")),
        "services": services,
        "labs": {"heading": text(labs.find("h2")), "paragraphs": [text(p) for p in labs.find_all("p")],
                 "image": image(*img_attrs(labs_img)[:1], "index.html", "banners", "FinTech Labs", "/")},
        "certifications": {"heading": text(sec("bf092da").find("h2")),
                           "image": image(img_attrs(cert)[0], "index.html", "images",
                                          "GSA Schedule GS-35F-0561Y, CMMI DEV ML3 appraised, ISO 27001, ISO 20000 and ISO 9001:2015 certifications", "/")},
        "insightsHeading": text(sec("d407116").find("h2")),
        "insights": insights,
        "omitted": {
            "heroBackground": "hero background (uploads/2025/03/5.png, 6.png) was never archived",
            "serviceCardBackgrounds": "8 of 9 service card background images were never archived",
            "whyChooseBody": "the 'Why Choose' section has only a heading and a 'Learn More' button (linked to the homepage itself) in the archive",
        },
    }


def extract_industries():
    soup = load(rec("pages/industry.html"))
    main = soup.find("main")
    names = ["Startups & Small Enterprises", "Legal & Financial Services", "Healthcare & Insurance",
             "Public Sector & Nonprofits", "Education & EdTech"]
    out = []
    for h2 in main.find_all("h2"):
        if text(h2) not in names:
            continue
        # the industry block is the nearest ancestor container that also holds its H3/list
        box = h2
        while box.parent is not None and not box.find("ul"):
            box = box.parent
        h3 = box.find("h3")
        ps = [text(p) for p in box.find_all("p") if text(p) and text(p) != "Key Features:"]
        items = [text(li) for li in box.find_all("li")]
        img = box.find("img")
        info = image(img_attrs(img)[0], "pages/industry.html", "industries", text(h2), "/industry/") if img else None
        out.append({"name": text(h2), "headline": text(h3), "summary": ps[0] if ps else "", "features": items,
                    "image": info, "href": "/industry/"})
    return out


def extract_partners(posts_by_path):
    cards = listing_cards("pages/partners.html")
    out = []
    for r, info in cards.items():
        post = posts_by_path.get(r)
        if not post:
            continue
        out.append({"name": post["title"], "href": r, "image": post["featuredImage"]})
    return out


def extract_offices():
    soup = load(rec("pages/contact-us.html"))
    main = soup.find("main")
    offices = [{"name": "TEXAS / HQ", "address": "7247 marquis ln, irving, tx , 75063"}]
    for h3 in main.find_all("h3"):
        nxt = h3.find_next("p")
        if nxt and text(h3).isupper():
            offices.append({"name": text(h3), "address": text(nxt)})
    phones = [text(p) for p in main.find_all("p") if text(p).startswith(("US :", "Whatsapp US"))]
    emails = re.findall(r"[\w.]+@fintechsolllc\.com", text(main))
    return {"offices": offices, "phoneLines": phones, "emails": sorted(set(emails), key=emails.index),
            "intro": [text(p) for p in main.find_all("p")[:3]]}


# ------------------------------------------------------------------ fonts
def copy_fonts():
    src = rec("assets", "fonts", "fonts.gstatic.com", "s")
    files = {"ubuntu-400.woff2": "ubuntu/v20/4iCs6KVjbNBYlgoKfw72.woff2",
             "ubuntu-500.woff2": "ubuntu/v20/4iCv6KVjbNBYlgoCjC3jsGyN.woff2",
             "ubuntu-700.woff2": "ubuntu/v20/4iCv6KVjbNBYlgoCxCvjsGyN.woff2",
             "poppins-400.woff2": "poppins/v23/pxiEyp8kv8JHgFVrJJfecg.woff2",
             "poppins-600.woff2": "poppins/v23/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2",
             "lato-400.woff2": "lato/v24/S6uyw4BMUTPHjx4wXg.woff2",
             "lato-700.woff2": "lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2"}
    dest = os.path.join(APP, "src", "app", "fonts")
    os.makedirs(dest, exist_ok=True)
    pub_dir = os.path.join(PUBLIC, "assets", "fonts")
    os.makedirs(pub_dir, exist_ok=True)
    for name, rel in files.items():
        s = os.path.join(src, *rel.split("/"))
        shutil.copyfile(s, os.path.join(dest, name))
        shutil.copyfile(s, os.path.join(pub_dir, name))
        ASSET_MAP[s] = {"src": f"/assets/fonts/{name}", "width": None, "height": None,
                        "original": "https://fonts.gstatic.com/s/" + rel,
                        "recovered_file": os.path.relpath(s, REC).replace(os.sep, "/"),
                        "note": f"latin subset; the app loads it with next/font/local from src/app/fonts/{name}"}


# ------------------------------------------------------------------ redirects
POSTS_PER_PAGE, COURSES_PER_PAGE = 10, 12  # keep in sync with src/lib/content.ts


def build_redirects(courses, pcats, cats, posts):
    """Recovered URLs whose content exists elsewhere in the new site (consumed by next.config.ts)."""
    out = []
    live_pcats = {c["slug"] for c in pcats}
    pages_for = lambda n, per: max(1, -(-n // per))
    limits = {"/blog/": pages_for(len(posts), POSTS_PER_PAGE), "/shop/": pages_for(len(courses), COURSES_PER_PAGE)}
    limits.update({f"/category/{c['slug']}/": pages_for(len(c["posts"]), POSTS_PER_PAGE) for c in cats.values()})
    limits.update({f"/product-category/{c['slug']}/": pages_for(len(c["courses"]), COURSES_PER_PAGE) for c in pcats})
    for p in PAGES:
        path = p["path"]
        m = re.match(r"^/product-category/([^/]+)/", path)
        if m and m.group(1) not in live_pcats:
            out.append({"source": path, "destination": "/shop/", "reason": "course category was empty in the original store"})
            continue
        m = re.match(r"^(/(?:blog|shop|category/[^/]+|product-category/[^/]+)/)page/(\d+)/$", path)
        if m and m.group(1) in limits and int(m.group(2)) > limits[m.group(1)]:
            out.append({"source": path, "destination": m.group(1),
                        "reason": "pagination slot from the original archive; all its posts are on the listing's earlier pages"})
    return out


# ------------------------------------------------------------------ main
def dump(name, data):
    with open(os.path.join(CONTENT, name), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)


def main():
    os.makedirs(CONTENT, exist_ok=True)
    pub_assets = os.path.join(PUBLIC, "assets")
    if os.path.isdir(pub_assets):
        shutil.rmtree(pub_assets)  # generated output only; the recovery folder is never written
    copy_fonts()
    progress("fonts")
    site = extract_site()
    progress("site")
    cats = extract_categories()
    progress("categories", len(cats))
    posts = extract_posts(cats)
    progress("posts", len(posts))
    by_path = {p["path"]: p for p in posts}
    for c in cats.values():
        c["posts"] = [x for x in c["posts"] if x in by_path]
    pages = {}
    cat_for = {**{p: "images" for p in COMPANY + MORE + LEGAL}, **{s: "services" for s in SERVICES},
               "/our-partners/": "partners", "/industry/": "industries"}
    for path in CONTENT_PAGES:
        pages[path] = extract_page(path, cat_for.get(path, "images"))
        progress("page", path)
    courses, pcats = extract_courses()
    progress("courses", len(courses))
    shop = extract_page("/shop/", "services")
    home = extract_home()
    industries = extract_industries()
    partners = extract_partners(by_path)
    contact = extract_offices()

    dump("site.json", site)
    dump("home.json", home)
    dump("pages.json", pages)
    dump("posts.json", posts)
    dump("categories.json", list(cats.values()))
    dump("courses.json", courses)
    dump("course-categories.json", pcats)
    dump("shop.json", shop)
    dump("industries.json", industries)
    dump("partners.json", partners)
    dump("contact.json", contact)
    dump("redirects.json", build_redirects(courses, pcats, cats, posts))
    amap = sorted(ASSET_MAP.values(), key=lambda a: a["src"])
    dump("asset-map.json", amap)

    excluded_pages = [{"path": p["path"], "reason": excluded(p["path"])} for p in PAGES if excluded(p["path"])]
    not_handled = [p["path"] for p in PAGES if not excluded(p["path"]) and not route_for(p["path"]) and
                   not re.match(r"^/(blog|shop)/page/", p["path"])]
    failed = [u for u in json.load(open(rec("recovery-data", "urls.json"), encoding="utf-8")) if u["status"] == "failed"]
    uniq = lambda xs: [dict(t) for t in OrderedDict((tuple(sorted((k, str(v)) for k, v in x.items())), x) for x in xs)]
    out = {
        "counts": {"pages": len(pages), "posts": len(posts), "categories": len(cats), "courses": len(courses),
                   "courseCategories": len(pcats), "assets": len(amap), "industries": len(industries),
                   "partners": len(partners)},
        "excluded_pages": excluded_pages, "unrecovered_pages": [u["original_url"] for u in failed],
        "recovered_but_unrouted": not_handled,
        **{k: uniq(v) if v and isinstance(v[0], dict) else v for k, v in report.items()},
    }
    os.makedirs(os.path.join(APP, "migration"), exist_ok=True)
    with open(os.path.join(APP, "migration", "report.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print(json.dumps(out["counts"]), {k: len(v) for k, v in out.items() if isinstance(v, list)})


if __name__ == "__main__":
    main()
