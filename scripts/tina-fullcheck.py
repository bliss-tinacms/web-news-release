#!/usr/bin/env python3
"""TINA-FULLCHECK: compare Tina homepage SEO with exact live head metadata.

Run after deployment with SITE_URL, NEXT_PUBLIC_TINA_CLIENT_ID (or TINA_CLIENT_ID),
TINA_BRANCH, and TINA_TOKEN in the environment. Exits non-zero on stale or duplicate
primary metadata so a local MDX fallback cannot silently override a Tina save again.
"""
from __future__ import annotations

import json
import os
import time
from html.parser import HTMLParser
from urllib.parse import urljoin

import requests

SITE = os.environ.get("SITE_URL", "https://www.webnewsrelease.com").rstrip("/")
CLIENT_ID = (os.environ.get("NEXT_PUBLIC_TINA_CLIENT_ID") or os.environ.get("TINA_CLIENT_ID") or "").strip()
BRANCH = (os.environ.get("NEXT_PUBLIC_TINA_BRANCH") or os.environ.get("TINA_BRANCH") or "main").strip()
TOKEN = os.environ.get("TINA_TOKEN", "").strip()
if not CLIENT_ID or not TOKEN:
    raise SystemExit("TINA-FULLCHECK BLOCKED: Tina client ID and token are required")

TINA_URL = f"https://content.tinajs.io/2.4/content/{CLIENT_ID}/github/{BRANCH}"


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_head = False
        self.in_title = False
        self.in_jsonld = False
        self.titles: list[str] = []
        self._title: list[str] = []
        self.metas: list[dict[str, str | None]] = []
        self.links: list[dict[str, str | None]] = []
        self.jsonld: list[str] = []
        self._jsonld: list[str] = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "head":
            self.in_head = True
        elif self.in_head and tag == "title":
            self.in_title = True
            self._title = []
        elif self.in_head and tag == "meta":
            self.metas.append(values)
        elif self.in_head and tag == "link":
            self.links.append(values)
        elif self.in_head and tag == "script" and values.get("type") == "application/ld+json":
            self.in_jsonld = True
            self._jsonld = []

    def handle_endtag(self, tag):
        if tag == "title" and self.in_title:
            self.titles.append("".join(self._title).strip())
            self.in_title = False
        elif tag == "script" and self.in_jsonld:
            self.jsonld.append("".join(self._jsonld).strip())
            self.in_jsonld = False
        elif tag == "head":
            self.in_head = False

    def handle_data(self, data):
        if self.in_title:
            self._title.append(data)
        if self.in_jsonld:
            self._jsonld.append(data)


def tina_home_seo() -> dict:
    query = """
    query HomepageSeo($relativePath: String!) {
      page(relativePath: $relativePath) {
        seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
      }
    }
    """
    response = requests.post(
        TINA_URL,
        headers={"X-API-KEY": TOKEN, "Content-Type": "application/json", "Accept-Encoding": "identity"},
        json={"query": query, "variables": {"relativePath": "home.mdx"}},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload["data"]["page"]["seo"]


def values(items: list[dict], key: str, name: str) -> list[str]:
    return [str(item.get("content") or "") for item in items if item.get(key) == name]


def exact_one(label: str, actual: list[str], expected: str, failures: list[str]) -> None:
    if actual != [expected]:
        failures.append(f"{label}: expected exactly {[expected]!r}, got {actual!r}")


def main() -> int:
    seo = tina_home_seo()
    cache_buster = f"tina-fullcheck-{time.time_ns()}"
    response = requests.get(
        f"{SITE}/?{cache_buster}",
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache", "User-Agent": "TINA-FULLCHECK"},
        timeout=30,
    )
    response.raise_for_status()
    parser = HeadParser()
    parser.feed(response.text)

    title = seo.get("metaTitle") or "Web News Release"
    description = seo.get("metaDescription") or ""
    social_title = seo.get("ogTitle") or title
    social_description = seo.get("ogDescription") or description
    canonical = seo.get("canonicalUrl") or f"{SITE}/"
    canonical = urljoin(f"{SITE}/", canonical)
    robots = f"{'noindex' if seo.get('noindex') else 'index'}, {'nofollow' if seo.get('nofollow') else 'follow'}"

    failures: list[str] = []
    exact_one("title", parser.titles, title, failures)
    exact_one("description", values(parser.metas, "name", "description"), description, failures)
    exact_one("canonical", [str(x.get("href") or "") for x in parser.links if "canonical" in str(x.get("rel") or "").split()], canonical, failures)
    exact_one("og:title", values(parser.metas, "property", "og:title"), social_title, failures)
    exact_one("og:description", values(parser.metas, "property", "og:description"), social_description, failures)
    exact_one("og:url", values(parser.metas, "property", "og:url"), canonical, failures)
    exact_one("twitter:title[name]", values(parser.metas, "name", "twitter:title"), social_title, failures)
    exact_one("twitter:title[property]", values(parser.metas, "property", "twitter:title"), social_title, failures)
    exact_one("twitter:description[name]", values(parser.metas, "name", "twitter:description"), social_description, failures)
    exact_one("twitter:description[property]", values(parser.metas, "property", "twitter:description"), social_description, failures)
    exact_one("robots", values(parser.metas, "name", "robots"), robots, failures)

    print(json.dumps({
        "site": SITE,
        "status": response.status_code,
        "cache": response.headers.get("cf-cache-status"),
        "backend": {"title": title, "description": description, "socialTitle": social_title, "socialDescription": social_description, "canonical": canonical, "robots": robots},
        "frontend": {"title": parser.titles, "description": values(parser.metas, "name", "description"), "ogTitle": values(parser.metas, "property", "og:title"), "twitterTitle": values(parser.metas, "name", "twitter:title"), "canonical": [str(x.get("href") or "") for x in parser.links if "canonical" in str(x.get("rel") or "").split()], "robots": values(parser.metas, "name", "robots"), "jsonLdCount": len(parser.jsonld)},
        "failures": failures,
    }, ensure_ascii=False, indent=2))
    print(f"TINA_FULLCHECK_OK {not failures}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
