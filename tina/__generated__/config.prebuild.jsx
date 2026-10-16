// tina/config.ts
import { defineConfig } from "tinacms";

// tina/fields/category-checkbox-group.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCMS, wrapFieldsWithMeta } from "tinacms";
var CATEGORY_QUERY = `
  query DynamicCategoryOptions($after: String) {
    categoryConnection(first: 100, after: $after) {
      edges {
        node {
          title
          _sys { path }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
function categoryReference(sys) {
  return sys?.path?.trim() || "";
}
function labelFromReference(reference) {
  return reference.split("/").pop()?.replace(/\.(json|mdx|md)$/i, "").replace(/[-_]+/g, " ") || reference;
}
async function fetchAllCategories(cms) {
  if (!cms.api.tina) throw new Error("The Tina content API is not available.");
  const options = [];
  let after = null;
  for (let page = 0; page < 100; page += 1) {
    const response = await cms.api.tina.request(CATEGORY_QUERY, { variables: { after } });
    const connection = response?.categoryConnection;
    for (const edge of connection?.edges || []) {
      const value = categoryReference(edge?.node?._sys);
      if (!value) continue;
      options.push({ label: edge?.node?.title?.trim() || labelFromReference(value), value });
    }
    if (!connection?.pageInfo?.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return [...new Map(options.map((option) => [option.value, option])).values()].sort((a, b) => a.label.localeCompare(b.label));
}
function CategoryCheckboxInput(props) {
  const cms = useCMS();
  const selected = Array.isArray(props.input.value) ? props.input.value.filter((value) => typeof value === "string") : [];
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOptions(await fetchAllCategories(cms));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, [cms]);
  useEffect(() => {
    void load();
  }, [load]);
  const renderedOptions = useMemo(() => {
    const known = new Set(options.map((option) => option.value));
    const unavailable = selected.filter((value) => !known.has(value)).map((value) => ({ label: `${labelFromReference(value)} (currently unavailable)`, value }));
    return [...options, ...unavailable];
  }, [options, selected]);
  function toggle(value, checked) {
    const next = checked ? [.../* @__PURE__ */ new Set([...selected, value])] : selected.filter((item) => item !== value);
    props.input.onChange(next);
    props.input.onBlur?.();
  }
  return React.createElement("div", { style: { display: "grid", gap: "0.65rem" } }, React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" } }, React.createElement("span", { style: { color: "#64748b", fontSize: "0.85rem" } }, "Loaded from the Category collection; no options are defined in code."), React.createElement("button", { type: "button", onClick: () => void load(), disabled: loading, style: { color: "#2563eb", fontWeight: 600 } }, loading ? "Loading\u2026" : "Refresh")), error && React.createElement("div", { role: "alert", style: { color: "#b91c1c" } }, error), !loading && !error && renderedOptions.length === 0 && React.createElement("div", { style: { color: "#64748b" } }, "Create a Category document first, then click Refresh."), renderedOptions.map((option) => React.createElement("label", { key: option.value, style: { display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" } }, React.createElement(
    "input",
    {
      type: "checkbox",
      checked: selected.includes(option.value),
      onChange: (event) => toggle(option.value, event.currentTarget.checked)
    }
  ), React.createElement("span", null, option.label))));
}
var CategoryCheckboxGroupField = wrapFieldsWithMeta(CategoryCheckboxInput);

// src/components/mdx/YouTubeEmbed.template.ts
var youTubeEmbedTemplate = {
  name: "YouTubeEmbed",
  label: "YouTube Embed",
  fields: [
    {
      name: "videoId",
      label: "YouTube video ID",
      type: "string",
      required: true,
      description: "The 11-character ID from a YouTube URL (e.g. dQw4w9WgXcQ)"
    }
  ]
};

// tina/fields/seo.ts
var seoFields = {
  name: "seo",
  label: "SEO",
  description: "Search and social sharing settings for this content. Leave fields blank to use sensible fallbacks.",
  type: "object",
  fields: [
    {
      name: "metaTitle",
      label: "Meta Title",
      type: "string",
      description: "Browser/search title. Falls back to the page or post title when blank."
    },
    {
      name: "metaDescription",
      label: "Meta Description",
      type: "string",
      description: "Search result and social preview description. Falls back to the post description or site default when blank.",
      ui: {
        component: "textarea"
      }
    },
    {
      name: "ogTitle",
      label: "Social Share Title",
      type: "string",
      description: "Open Graph/Twitter title. Falls back to Meta Title when blank."
    },
    {
      name: "ogDescription",
      label: "Social Share Description",
      type: "string",
      description: "Open Graph/Twitter description. Falls back to Meta Description when blank.",
      ui: {
        component: "textarea"
      }
    },
    {
      name: "ogImage",
      label: "Social Share Image",
      type: "image",
      description: "Image used when sharing on social platforms. Falls back to the post hero image or default image when blank."
    },
    {
      name: "canonicalUrl",
      label: "Canonical URL",
      type: "string",
      description: "Optional canonical URL. Leave blank to use the current page URL."
    },
    {
      name: "noindex",
      label: "No Index",
      type: "boolean",
      description: "Ask search engines not to index this page/post."
    },
    {
      name: "nofollow",
      label: "No Follow",
      type: "boolean",
      description: "Ask search engines not to follow links on this page/post."
    }
  ]
};

// tina/fields/view-frontend.ts
import React2 from "react";
function normalizeSlug(value) {
  return String(value || "").toLowerCase().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\.(mdx?|json)$/i, "").split("/").map((part) => part.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean).join("/");
}
function filenameFromBrowser(kind) {
  if (typeof window === "undefined") return "";
  const text2 = decodeURIComponent(window.location.href || "").replace(/\\/g, "/");
  const pattern = kind === "blog" ? /src\/content\/blog\/([^?#]+?)\.(mdx?|json)/i : /src\/content\/page\/([^?#]+?)\.(mdx?|json)/i;
  const match = text2.match(pattern);
  return match?.[1] || "";
}
function resolveFrontendUrl(kind, values) {
  const raw = values?.permalink || values?._sys?.filename || values?.filename || filenameFromBrowser(kind) || values?.title || values?.seoTitle || "";
  const slug = normalizeSlug(raw);
  if (kind === "blog") return slug ? "/" + (slug.startsWith("blog/") ? slug.slice(5) : slug) + "/" : "/blog/";
  if (!slug || slug === "home" || slug === "index") return "/";
  return "/" + slug + "/";
}
function ViewFrontendComponent(kind) {
  return function ViewFrontendField(props) {
    const values = props?.form?.getState?.()?.values || {};
    const href = resolveFrontendUrl(kind, values);
    const label = kind === "blog" ? "View Post" : "View Page";
    return React2.createElement(
      "div",
      {
        style: {
          border: "1px solid #bfdbfe",
          background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
          borderRadius: "12px",
          padding: "14px",
          margin: "0 0 18px",
          boxShadow: "0 6px 14px rgba(37, 99, 235, 0.06)"
        }
      },
      React2.createElement(
        "div",
        {
          style: {
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: ".12em",
            fontWeight: 800,
            color: "#1d4ed8",
            marginBottom: "8px"
          }
        },
        "Frontend Shortcut"
      ),
      React2.createElement(
        "div",
        { style: { display: "flex", gap: "10px", alignItems: "center" } },
        React2.createElement(
          "code",
          {
            style: {
              flex: 1,
              minWidth: 0,
              background: "#fff",
              border: "1px solid #dbe3ef",
              borderRadius: "8px",
              padding: "10px 11px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "12px",
              color: "#334155",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            },
            title: href
          },
          href
        ),
        React2.createElement(
          "a",
          {
            href,
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
              border: "none",
              background: "#14577a",
              color: "#fff",
              borderRadius: "8px",
              padding: "11px 14px",
              fontWeight: 800,
              fontSize: "13px",
              lineHeight: 1,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap"
            }
          },
          "View"
        )
      ),
      React2.createElement(
        "p",
        { style: { margin: "10px 0 0", color: "#64748b", fontSize: "12px", lineHeight: 1.45 } },
        label + " opens in a new tab. Save first if you changed the permalink."
      )
    );
  };
}
function viewFrontendField(kind) {
  return {
    type: "string",
    name: kind === "blog" ? "viewPostShortcut" : "viewPageShortcut",
    label: kind === "blog" ? "View Post" : "View Page",
    ui: {
      component: ViewFrontendComponent(kind)
    }
  };
}

// tina/collections/blog.ts
function slugifyFilename(value) {
  if (!value || typeof value !== "string") return "untitled";
  let input = value.trim().toLowerCase();
  if (!input) return "untitled";
  if (input.startsWith("http://") || input.startsWith("https://")) input = input.split("/").slice(3).join("/");
  input = input.split("?")[0].split("#")[0].split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  if (input.startsWith("blog/")) input = input.slice(5);
  let output = "";
  let lastWasDash = false;
  for (const ch of input) {
    const isLetter = ch >= "a" && ch <= "z";
    const isNumber = ch >= "0" && ch <= "9";
    const isSlash = ch === "/";
    const isAllowed = isLetter || isNumber || isSlash || ch === "-" || ch === "_" || ch === ".";
    if (isAllowed) {
      output += ch;
      lastWasDash = false;
    } else if (!lastWasDash) {
      output += "-";
      lastWasDash = true;
    }
  }
  while (output.startsWith("-")) output = output.slice(1);
  while (output.endsWith("-")) output = output.slice(0, -1);
  while (output.includes("//")) output = output.split("//").join("/");
  return output || "untitled";
}
function cleanPublicSlug(value) {
  if (!value || typeof value !== "string") return "";
  let input = value.trim().toLowerCase();
  if (!input || input === "untitled") return "";
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const parts = input.split("/");
    input = parts.slice(3).join("/");
  }
  input = input.split("?")[0].split("#")[0];
  input = input.split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  while (input.includes("//")) input = input.split("//").join("/");
  return input;
}
function filenameFromDocument(document) {
  return cleanPublicSlug(document?._sys?.filename || document?._sys?.basename || "");
}
var BlogCollection = {
  name: "blog",
  label: "Blogs",
  path: "src/content/blog",
  format: "mdx",
  ui: {
    filename: {
      readonly: false,
      parse: (filename) => slugifyFilename(filename),
      slugify: (values) => slugifyFilename(values?.title || "untitled")
    },
    router: ({ document }) => {
      const raw = cleanPublicSlug(document?.permalink) || filenameFromDocument(document);
      const slug = raw.startsWith("blog/") ? raw.slice(5) : raw;
      return slug ? "/" + slug : "/blog/";
    }
  },
  fields: [
    viewFrontendField("blog"),
    { type: "string", name: "title", label: "Title", isTitle: true, required: true },
    { name: "permalink", label: "Permalink", type: "string", description: "Optional custom public URL path. Leave blank to use the filename/slug." },
    { name: "description", label: "Description", type: "string" },
    seoFields,
    { name: "pubDate", label: "Publication Date", type: "datetime" },
    { name: "updatedDate", label: "Updated Date", type: "datetime" },
    {
      label: "Categories",
      name: "categories",
      type: "string",
      list: true,
      description: "Select one or more Category documents. Options are queried live from the Category collection; none are hardcoded in the schema or UI.",
      ui: { component: CategoryCheckboxGroupField }
    },
    {
      name: "author",
      label: "Author / User",
      type: "reference",
      collections: ["user"],
      description: "Assign this post to a user profile, similar to a WordPress post author."
    },
    { name: "heroImage", label: "Hero Image", type: "image" },
    { name: "authorAlt", label: "Author Alt Text", type: "string", description: "Alt text for the author image." },
    { name: "heroImageAlt", label: "Hero Image Alt Text", type: "string", description: "Alt text for the hero image." },
    { name: "heroImageCaption", label: "Hero Image Caption", type: "string", ui: { component: "textarea" } },
    { name: "correctionDate", label: "Correction Date", type: "datetime" },
    { name: "correctionText", label: "Correction Notice", type: "string", ui: { component: "textarea" } },
    { type: "rich-text", name: "body", label: "Body", isBody: true, templates: [youTubeEmbedTemplate] }
  ]
};

// tina/collections/category.ts
var CategoryCollection = {
  name: "category",
  label: "Categories",
  path: "src/content/category",
  format: "json",
  ui: {
    router({ document }) {
      return `/${String(document._sys.filename || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}/`;
    }
  },
  fields: [
    {
      type: "string",
      name: "title",
      label: "Category Name",
      isTitle: true,
      required: true
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      ui: {
        component: "textarea"
      }
    },
    seoFields
  ]
};

// tina/collections/global-config.ts
var GlobalConfigCollection = {
  name: "config",
  label: "Global Config",
  path: "src/content/config",
  format: "json",
  ui: {
    global: true
  },
  fields: [
    {
      name: "headerNavigation",
      label: "Header Navigation",
      type: "reference",
      collections: ["navigation"],
      description: "Choose the Navigation document used in the site header."
    },
    {
      name: "footerNavigation",
      label: "Footer Navigation",
      type: "reference",
      collections: ["navigation"],
      description: "Choose the Navigation document used in the site footer."
    },
    {
      name: "favicon",
      label: "Favicon",
      type: "image",
      description: "Legacy top-level favicon field kept for TinaCloud schema compatibility. Prefer Site Identity & SEO \u2192 Favicon for editing."
    },
    {
      name: "seo",
      label: "Site Identity & SEO",
      type: "object",
      fields: [
        { name: "title", label: "Site Name", type: "string" },
        { name: "description", label: "Default Meta Description", type: "string", ui: { component: "textarea" } },
        { name: "siteOwner", label: "Site Owner", type: "string" },
        { name: "logo", label: "Logo", type: "image" },
        {
          name: "favicon",
          label: "Favicon",
          type: "image",
          description: "Upload the browser tab/site icon. Recommended: square PNG, SVG, or ICO."
        },
        {
          name: "footerLogo",
          label: "Footer Logo",
          type: "image",
          description: "Upload the logo used in the footer. Falls back to the header logo when empty."
        }
      ]
    },
    {
      name: "branding",
      label: "Global Header & Footer",
      type: "object",
      fields: [
        { name: "menuLabel", label: "Mobile Menu Label", type: "string" },
        { name: "footerDescription", label: "Footer Description", type: "string", ui: { component: "textarea" } },
        { name: "copyright", label: "Copyright Line", type: "string" }
      ]
    },
    {
      name: "contactForm",
      label: "Contact Form",
      type: "object",
      fields: [
        { name: "formspreeEndpoint", label: "Formspree Endpoint URL", type: "string" },
        { name: "heading", label: "Heading", type: "string" },
        { name: "description", label: "Description", type: "string", ui: { component: "textarea" } },
        { name: "buttonText", label: "Button Text", type: "string" },
        { name: "note", label: "Form Note", type: "string", ui: { component: "textarea" } },
        { name: "subject", label: "Email Subject", type: "string" }
      ]
    },
    {
      name: "codeInjection",
      label: "Code Injection",
      type: "object",
      fields: [
        { name: "headerCode", label: "Header Code", type: "string", ui: { component: "textarea" } },
        { name: "footerCode", label: "Footer Code", type: "string", ui: { component: "textarea" } }
      ]
    },
    {
      name: "contactLinks",
      label: "Contact Links",
      type: "object",
      list: true,
      ui: { itemProps: (item) => ({ label: item.title }) },
      fields: [
        { name: "title", label: "Title", type: "string" },
        { name: "link", label: "Link", type: "string" },
        { name: "icon", label: "Icon", type: "string" }
      ]
    },
    {
      name: "footerStarfield",
      label: "Show starfield in footer",
      type: "boolean"
    }
  ]
};

// tina/collections/navigation.ts
var NavigationCollection = {
  name: "navigation",
  label: "Navigation",
  path: "src/content/navigation",
  format: "json",
  fields: [
    { name: "title", label: "Navigation Name", type: "string", isTitle: true, required: true },
    {
      name: "items",
      label: "Navigation Items",
      type: "object",
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label || "Menu item" }) },
      fields: [
        { name: "label", label: "Label", type: "string", required: true },
        { name: "href", label: "URL", type: "string", required: true },
        {
          name: "children",
          label: "Submenu Items",
          type: "object",
          list: true,
          ui: { itemProps: (item) => ({ label: item?.label || "Submenu item" }) },
          fields: [
            { name: "label", label: "Label", type: "string", required: true },
            { name: "href", label: "URL", type: "string", required: true }
          ]
        }
      ]
    }
  ]
};

// src/components/blocks/hero.template.ts
var heroBlockSchema = {
  name: "hero",
  label: "Hero",
  fields: [
    { type: "string", label: "Headline", name: "headline" },
    { type: "string", label: "Tagline", name: "tagline" },
    {
      type: "object",
      label: "Actions",
      name: "actions",
      list: true,
      ui: { defaultItem: { label: "Get Started", type: "button", link: "/" }, itemProps: (i) => ({ label: i.label ?? "" }) },
      fields: [
        { type: "string", label: "Label", name: "label" },
        { type: "string", label: "Type", name: "type", options: [{ label: "Button", value: "button" }, { label: "Link", value: "link" }] },
        { type: "string", label: "Icon (Tabler name)", name: "icon" },
        { type: "string", label: "Link", name: "link" }
      ]
    },
    {
      type: "object",
      label: "Image",
      name: "image",
      fields: [
        { name: "src", label: "Image Source", type: "image" },
        { name: "alt", label: "Alt Text", type: "string" }
      ]
    },
    { type: "boolean", label: "Show starfield", name: "starfield" }
  ],
  ui: {
    defaultItem: {
      tagline: "Here's some text above the other text",
      headline: "Astro + TinaCMS, ready to ship",
      starfield: true
    }
  }
};

// src/components/blocks/features.template.ts
var featuresBlockSchema = {
  name: "features",
  label: "Features",
  fields: [
    { type: "string", label: "Title", name: "title" },
    { type: "string", label: "Description", name: "description" },
    {
      type: "object",
      label: "Feature Items",
      name: "items",
      list: true,
      ui: { itemProps: (i) => ({ label: i?.title ?? "" }), defaultItem: { title: "Here's a feature", icon: "edit" } },
      fields: [
        { type: "string", label: "Icon (Tabler name)", name: "icon" },
        { type: "string", label: "Title", name: "title" },
        { type: "rich-text", label: "Text", name: "text" }
      ]
    }
  ],
  ui: {
    defaultItem: {
      title: "Built to cover your needs",
      description: "Everything you need to build content-driven sites.",
      items: [
        { title: "Visual editing", icon: "edit" },
        { title: "Composable blocks", icon: "layout-grid" },
        { title: "Git-backed", icon: "brand-git" }
      ]
    }
  }
};

// src/components/blocks/stats.template.ts
var statsBlockSchema = {
  name: "stats",
  label: "Stats",
  fields: [
    { type: "string", label: "Title", name: "title" },
    { type: "string", label: "Description", name: "description" },
    {
      type: "object",
      label: "Stats",
      name: "stats",
      list: true,
      ui: { defaultItem: { stat: "12K", type: "Stars on GitHub" }, itemProps: (i) => ({ label: `${i.stat ?? ""} ${i.type ?? ""}` }) },
      fields: [
        { type: "string", label: "Stat", name: "stat" },
        { type: "string", label: "Type", name: "type" }
      ]
    }
  ],
  ui: {
    defaultItem: {
      title: "TinaCMS by the numbers",
      description: "An open-source, Git-backed CMS.",
      stats: [{ stat: "12K", type: "Stars on GitHub" }, { stat: "11K", type: "Active Users" }, { stat: "22K", type: "Powered Apps" }]
    }
  }
};

// src/components/blocks/cta.template.ts
var ctaBlockSchema = {
  name: "cta",
  label: "CTA",
  fields: [
    { type: "string", label: "Title", name: "title" },
    { type: "string", label: "Description", name: "description", ui: { component: "textarea" } },
    {
      type: "object",
      label: "Actions",
      name: "actions",
      list: true,
      ui: {
        defaultItem: { label: "Get Started", type: "button", link: "/" },
        itemProps: (item) => ({ label: item.label ?? "" })
      },
      fields: [
        { type: "string", label: "Label", name: "label" },
        { type: "string", label: "Type", name: "type", options: [
          { label: "Button", value: "button" },
          { label: "Link", value: "link" }
        ] },
        { type: "string", label: "Icon (Tabler name)", name: "icon" },
        { type: "string", label: "Link", name: "link" }
      ]
    }
  ],
  ui: {
    defaultItem: {
      title: "Start Building",
      description: "Get started with TinaCMS today and take your content management to the next level.",
      actions: [
        { label: "Get Started", type: "button", link: "/" },
        { label: "Book Demo", type: "link", link: "/" }
      ]
    }
  }
};

// src/components/blocks/testimonial.template.ts
var testimonialBlockSchema = {
  name: "testimonial",
  label: "Testimonial",
  fields: [
    { type: "string", label: "Title", name: "title" },
    { type: "string", label: "Description", name: "description", ui: { component: "textarea" } },
    {
      type: "object",
      list: true,
      label: "Testimonials",
      name: "testimonials",
      ui: { defaultItem: { quote: "There are only two hard things in Computer Science: cache invalidation and naming things.", author: "Phil Karlton" }, itemProps: (i) => ({ label: `${i.quote ?? ""} - ${i.author ?? ""}` }) },
      fields: [
        { type: "string", label: "Quote", name: "quote", ui: { component: "textarea" } },
        { type: "string", label: "Author", name: "author" },
        { type: "string", label: "Role", name: "role" },
        { type: "image", label: "Avatar", name: "avatar" }
      ]
    }
  ],
  ui: {
    defaultItem: {
      title: "Loved by developers",
      testimonials: [{ quote: "There are only two hard things in Computer Science: cache invalidation and naming things.", author: "Phil Karlton" }]
    }
  }
};

// src/components/blocks/callout.template.ts
var calloutBlockSchema = {
  name: "callout",
  label: "Callout",
  fields: [
    { type: "string", label: "Text", name: "text" },
    { type: "string", label: "Url", name: "url" }
  ],
  ui: {
    defaultItem: { url: "https://tina.io/editorial-workflow", text: "Support for live editing and editorial workflow" }
  }
};

// src/components/blocks/content.template.ts
var contentBlockSchema = {
  name: "content",
  label: "Content",
  fields: [
    { type: "rich-text", label: "Body", name: "body" }
  ],
  ui: {
    defaultItem: {}
  }
};

// src/components/blocks/video.template.ts
var videoBlockSchema = {
  name: "video",
  label: "Video",
  fields: [
    { type: "string", label: "Url (YouTube/Vimeo embed or watch URL)", name: "url" },
    { type: "boolean", label: "Auto Play", name: "autoPlay" },
    { type: "boolean", label: "Loop", name: "loop" }
  ],
  ui: { defaultItem: { url: "https://www.youtube.com/watch?v=j8egYW7Jpgk" } }
};

// src/components/blocks/split.template.ts
var splitBlockSchema = {
  name: "split",
  label: "Split (Text + Image)",
  fields: [
    { type: "string", label: "Title", name: "title" },
    { type: "rich-text", label: "Body", name: "body" },
    {
      type: "object",
      label: "Image",
      name: "image",
      fields: [
        { name: "src", label: "Image Source", type: "image" },
        { name: "alt", label: "Alt Text", type: "string" }
      ]
    },
    { type: "boolean", label: "Image on left", name: "reverse" },
    {
      type: "object",
      label: "Actions",
      name: "actions",
      list: true,
      ui: { defaultItem: { label: "Learn more", type: "button", link: "/" }, itemProps: (i) => ({ label: i.label ?? "" }) },
      fields: [
        { type: "string", label: "Label", name: "label" },
        { type: "string", label: "Type", name: "type", options: [{ label: "Button", value: "button" }, { label: "Link", value: "link" }] },
        { type: "string", label: "Icon (Tabler name)", name: "icon" },
        { type: "string", label: "Link", name: "link" }
      ]
    }
  ],
  ui: {
    defaultItem: {
      title: "A headline that sits beside your image"
    }
  }
};

// src/components/blocks/about-mockup17.template.ts
var aboutMockup17BlockSchema = {
  name: "aboutMockup17",
  label: "About Page Template Sections",
  fields: [
    {
      type: "object",
      name: "hero",
      label: "Hero Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "headline", label: "Headline", type: "string" },
        { name: "lede", label: "Lede", type: "string", ui: { component: "textarea" } }
      ]
    },
    {
      type: "object",
      name: "purpose",
      label: "Our Purpose Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "paragraphOne", label: "Paragraph 1", type: "string", ui: { component: "textarea" } },
        { name: "pullquote", label: "Pullquote", type: "string", ui: { component: "textarea" } },
        { name: "paragraphTwo", label: "Paragraph 2", type: "string", ui: { component: "textarea" } }
      ]
    },
    {
      type: "object",
      name: "coverage",
      label: "Coverage Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "intro", label: "Intro", type: "string", ui: { component: "textarea" } },
        {
          name: "items",
          label: "Coverage Cards",
          type: "object",
          list: true,
          fields: [
            { name: "number", label: "Number", type: "string" },
            { name: "title", label: "Title", type: "string" },
            { name: "text", label: "Text", type: "string", ui: { component: "textarea" } },
            { name: "link", label: "Link", type: "string" }
          ]
        }
      ]
    },
    {
      type: "object",
      name: "standardsSection",
      label: "What We Stand For Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "intro", label: "Intro", type: "string", ui: { component: "textarea" } },
        {
          name: "items",
          label: "Standards Rows",
          type: "object",
          list: true,
          fields: [
            { name: "number", label: "Number", type: "string" },
            { name: "title", label: "Title", type: "string" },
            { name: "text", label: "Text", type: "string", ui: { component: "textarea" } }
          ]
        }
      ]
    },
    {
      type: "object",
      name: "independence",
      label: "Independence Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "image", label: "Image", type: "image" },
        { name: "imageAlt", label: "Image Alt Text", type: "string" },
        { name: "paragraphOne", label: "Paragraph 1", type: "string", ui: { component: "textarea" } },
        { name: "paragraphTwo", label: "Paragraph 2", type: "string", ui: { component: "textarea" } },
        { name: "buttonText", label: "Button Text", type: "string" },
        { name: "buttonLink", label: "Button Link", type: "string" }
      ]
    },
    {
      type: "object",
      name: "newsroom",
      label: "Reach the Newsroom Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "intro", label: "Intro", type: "string", ui: { component: "textarea" } },
        {
          name: "contacts",
          label: "Contact Cards",
          type: "object",
          list: true,
          fields: [
            { name: "icon", label: "Icon", type: "string", options: ["chat", "alert", "document"] },
            { name: "title", label: "Title", type: "string" },
            { name: "email", label: "Email", type: "string" },
            { name: "text", label: "Text", type: "string", ui: { component: "textarea" } }
          ]
        }
      ]
    },
    {
      type: "object",
      name: "publicationHeader",
      label: "Publication Header",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "headline", label: "Headline", type: "string" },
        { name: "description", label: "Description", type: "string", ui: { component: "textarea" } },
        {
          name: "facts",
          label: "Publication Facts",
          type: "object",
          list: true,
          fields: [
            { name: "label", label: "Label", type: "string" },
            { name: "value", label: "Value", type: "string" }
          ]
        }
      ]
    },
    {
      type: "object",
      name: "documentSections",
      label: "About Document Sections",
      list: true,
      fields: [
        { name: "number", label: "Number", type: "string" },
        { name: "navTitle", label: "Navigation Title", type: "string" },
        { name: "sectionLabel", label: "Section Label", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "lead", label: "Lead Paragraph", type: "string", ui: { component: "textarea" } },
        {
          name: "paragraphs",
          label: "Paragraphs",
          type: "object",
          list: true,
          fields: [{ name: "text", label: "Text", type: "string", ui: { component: "textarea" } }]
        },
        {
          name: "principles",
          label: "Principles",
          type: "object",
          list: true,
          fields: [
            { name: "number", label: "Number", type: "string" },
            { name: "text", label: "Text", type: "string", ui: { component: "textarea" } }
          ]
        },
        { name: "note", label: "Note", type: "string", ui: { component: "textarea" } }
      ]
    }
  ]
};

// src/components/blocks/contact-mockup17.template.ts
var contactMockup17BlockSchema = {
  name: "contactMockup17",
  label: "Contact Page Template Sections",
  fields: [
    {
      type: "object",
      name: "hero",
      label: "Hero Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "headline", label: "Headline", type: "string" },
        { name: "lede", label: "Lede", type: "string", ui: { component: "textarea" } },
        { name: "newsroomEmail", label: "Newsroom Email", type: "string" },
        { name: "generalEmail", label: "General Email", type: "string" },
        { name: "replyTime", label: "Typical Reply Time", type: "string" }
      ]
    },
    {
      type: "object",
      name: "formSection",
      label: "Message Form Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "description", label: "Description", type: "string", ui: { component: "textarea" } },
        { name: "buttonText", label: "Button Text", type: "string" },
        { name: "note", label: "Form Note", type: "string", ui: { component: "textarea" } },
        { name: "goesTo", label: "Goes To", type: "string" },
        { name: "readBy", label: "Read By", type: "string" },
        { name: "replyWindow", label: "Reply Window", type: "string" },
        { name: "formAction", label: "Form Action URL / Formspree Endpoint", type: "string", description: "Optional. Leave blank to keep the form non-submitting until an endpoint is added." },
        { name: "subject", label: "Email Subject", type: "string" }
      ]
    },
    {
      type: "object",
      name: "inboxes",
      label: "Where to Write / Inbox Cards",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        {
          name: "cards",
          label: "Inbox Cards",
          type: "object",
          list: true,
          fields: [
            { name: "title", label: "Title", type: "string" },
            { name: "description", label: "Description", type: "string", ui: { component: "textarea" } },
            { name: "email", label: "Email", type: "string" },
            { name: "note", label: "Note", type: "string", ui: { component: "textarea" } }
          ]
        }
      ]
    },
    {
      type: "object",
      name: "requests",
      label: "Specific Requests Section",
      fields: [
        { name: "eyebrow", label: "Eyebrow", type: "string" },
        { name: "title", label: "Title", type: "string" },
        { name: "intro", label: "Intro", type: "string", ui: { component: "textarea" } },
        {
          name: "cards",
          label: "Request Cards",
          type: "object",
          list: true,
          fields: [
            { name: "icon", label: "Icon", type: "string", options: ["alert", "document", "mail"] },
            { name: "title", label: "Title", type: "string" },
            { name: "text", label: "Text", type: "string", ui: { component: "textarea" } }
          ]
        }
      ]
    }
  ]
};

// src/components/blocks/our-team-mockup17.template.ts
var ourTeamMockup17BlockSchema = {
  name: "ourTeamMockup17",
  label: "Our Team Page Template Sections",
  fields: [
    { type: "object", name: "hero", label: "Hero Section", fields: [
      { name: "eyebrow", label: "Eyebrow", type: "string" },
      { name: "headline", label: "Headline", type: "string" },
      { name: "lede", label: "Lede", type: "string", ui: { component: "textarea" } }
    ] },
    { type: "object", name: "leadership", label: "Leadership Section", fields: [
      { name: "eyebrow", label: "Eyebrow", type: "string" },
      { name: "title", label: "Title", type: "string" },
      { name: "people", label: "Leadership People", type: "object", list: true, fields: [
        { name: "name", label: "Name", type: "string" },
        { name: "role", label: "Role", type: "string" },
        { name: "location", label: "Location", type: "string" },
        { name: "image", label: "Photo", type: "image" },
        { name: "imageAlt", label: "Photo Alt Text", type: "string" },
        { name: "bio", label: "Bio", type: "string", ui: { component: "textarea" } },
        { name: "tagline", label: "Leadership Tagline", type: "string" },
        { name: "recordTitle", label: "Record Panel Title", type: "string" },
        { name: "authorSlug", label: "Author Archive Slug", type: "string" },
        { name: "records", label: "On-the-record Details", type: "object", list: true, fields: [
          { name: "label", label: "Label", type: "string" },
          { name: "value", label: "Value", type: "string" }
        ] }
      ] }
    ] },
    { type: "object", name: "seniorStaff", label: "Senior Editorial Staff Section", fields: [
      { name: "eyebrow", label: "Eyebrow", type: "string" },
      { name: "title", label: "Title", type: "string" },
      { name: "people", label: "Staff Cards", type: "object", list: true, fields: [
        { name: "name", label: "Name", type: "string" },
        { name: "role", label: "Role", type: "string" },
        { name: "location", label: "Location", type: "string" },
        { name: "image", label: "Photo", type: "image" },
        { name: "imageAlt", label: "Photo Alt Text", type: "string" },
        { name: "bio", label: "Bio", type: "string", ui: { component: "textarea" } },
        { name: "authorSlug", label: "Author Archive Slug", type: "string" }
      ] }
    ] }
  ]
};

// src/components/blocks/homepage-template.template.ts
var text = (name, label) => ({ name, label, type: "string" });
var textarea = (name, label) => ({ name, label, type: "string", ui: { component: "textarea" } });
var image = (name, label) => ({ name, label, type: "image" });
var homepageTemplateBlockSchema = {
  name: "homepageTemplate",
  label: "Homepage \u2014 Mockup 31",
  fields: [
    {
      type: "object",
      name: "hero",
      label: "Hero",
      fields: [
        text("tag", "Tag"),
        text("title", "Headline"),
        textarea("description", "Description"),
        image("image", "Hero Image"),
        text("imageAlt", "Hero Image Alt Text")
      ]
    },
    {
      type: "object",
      name: "latest",
      label: "Latest Stories",
      fields: [
        text("title", "Section Title"),
        text("updatedLabel", "Update Label"),
        {
          type: "object",
          list: true,
          name: "items",
          label: "Story Cards",
          ui: { itemProps: (item) => ({ label: item?.title || "Story card" }) },
          fields: [
            text("category", "Category"),
            text("meta", "Secondary Label"),
            text("title", "Headline"),
            textarea("description", "Summary"),
            image("image", "Image"),
            text("imageAlt", "Image Alt Text"),
            text("link", "Link URL")
          ]
        }
      ]
    },
    {
      type: "object",
      name: "mission",
      label: "Our Purpose",
      fields: [
        text("eyebrow", "Eyebrow"),
        text("title", "Statement"),
        {
          type: "object",
          list: true,
          name: "paragraphs",
          label: "Paragraphs",
          ui: { itemProps: (item) => ({ label: item?.text?.slice(0, 48) || "Paragraph" }) },
          fields: [textarea("text", "Text"), { name: "bold", label: "Bold Paragraph", type: "boolean" }]
        },
        text("signature", "Signature")
      ]
    },
    {
      type: "object",
      name: "coverage",
      label: "Coverage Areas",
      fields: [
        text("eyebrow", "Eyebrow"),
        text("title", "Heading"),
        {
          type: "object",
          list: true,
          name: "items",
          label: "Coverage Cards",
          ui: { itemProps: (item) => ({ label: item?.title || "Coverage card" }) },
          fields: [text("number", "Number"), text("label", "Short Label"), text("title", "Title"), textarea("text", "Description"), text("link", "Link URL")]
        }
      ]
    },
    {
      type: "object",
      name: "quote",
      label: "Editorial Quote",
      fields: [
        text("eyebrow", "Eyebrow"),
        textarea("quote", "Quote"),
        text("author", "Author"),
        text("byline", "Byline"),
        image("image", "Image"),
        text("imageAlt", "Image Alt Text")
      ]
    },
    {
      type: "object",
      name: "standards",
      label: "Editorial Standards",
      fields: [
        text("eyebrow", "Eyebrow"),
        text("title", "Heading"),
        {
          type: "object",
          list: true,
          name: "items",
          label: "Standards",
          ui: { itemProps: (item) => ({ label: item?.tab || "Standard" }) },
          fields: [text("tab", "Tab Label"), text("number", "Number"), textarea("text", "Description")]
        },
        text("seal", "Closing Line")
      ]
    },
    {
      type: "object",
      name: "team",
      label: "Newsroom Team",
      fields: [
        text("eyebrow", "Eyebrow"),
        text("title", "Heading"),
        {
          type: "object",
          list: true,
          name: "members",
          label: "Team Members",
          ui: { itemProps: (item) => ({ label: item?.name || "Team member" }) },
          fields: [image("image", "Photo"), text("imageAlt", "Photo Alt Text"), text("name", "Name"), text("role", "Role and Location"), textarea("text", "Description"), text("link", "Profile Link URL")]
        }
      ]
    },
    {
      type: "object",
      name: "cta",
      label: "Write For Us",
      fields: [
        text("eyebrow", "Eyebrow"),
        text("title", "Heading"),
        textarea("description", "Description"),
        {
          type: "object",
          list: true,
          name: "points",
          label: "Pitch Instructions",
          ui: { itemProps: (item) => ({ label: item?.text || "Instruction" }) },
          fields: [text("number", "Number"), text("text", "Instruction")]
        },
        text("buttonText", "Button Text"),
        text("buttonLink", "Button Link URL")
      ]
    }
  ]
};

// tina/collections/page.ts
function slugifyFilename2(value) {
  if (!value || typeof value !== "string") return "untitled";
  let input = value.trim().toLowerCase();
  if (!input) return "untitled";
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const parts = input.split("/");
    input = parts.slice(3).join("/");
  }
  input = input.split("?")[0].split("#")[0];
  input = input.split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  if (input.startsWith("blog/")) input = input.slice(5);
  let output = "";
  let lastWasDash = false;
  for (const ch of input) {
    const isLetter = ch >= "a" && ch <= "z";
    const isNumber = ch >= "0" && ch <= "9";
    const isSlash = ch === "/";
    const isAllowed = isLetter || isNumber || isSlash || ch === "-" || ch === "_" || ch === ".";
    if (isAllowed) {
      output += ch;
      lastWasDash = false;
    } else if (!lastWasDash) {
      output += "-";
      lastWasDash = true;
    }
  }
  while (output.startsWith("-")) output = output.slice(1);
  while (output.endsWith("-")) output = output.slice(0, -1);
  while (output.includes("//")) output = output.split("//").join("/");
  return output || "untitled";
}
function cleanPublicSlug2(value) {
  if (!value || typeof value !== "string") return "";
  let input = value.trim().toLowerCase();
  if (!input || input === "untitled") return "";
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const parts = input.split("/");
    input = parts.slice(3).join("/");
  }
  input = input.split("?")[0].split("#")[0];
  input = input.split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  while (input.includes("//")) input = input.split("//").join("/");
  return input;
}
function filenameFromDocument2(document) {
  return cleanPublicSlug2(document?._sys?.filename || document?._sys?.basename || "");
}
var PageCollection = {
  name: "page",
  label: "Pages",
  path: "src/content/page",
  format: "mdx",
  ui: {
    filename: {
      readonly: false,
      parse: (filename) => slugifyFilename2(filename),
      slugify: (values) => slugifyFilename2(values?.title || "untitled")
    },
    router: ({ document }) => {
      const slug = cleanPublicSlug2(document?.permalink) || filenameFromDocument2(document);
      if (!slug || slug === "home" || slug === "index") return "/";
      return "/" + slug;
    }
  },
  fields: [
    viewFrontendField("page"),
    {
      name: "title",
      label: "Title",
      type: "string",
      isTitle: true,
      required: true,
      description: "Main visible page title shown at the top of the frontend page."
    },
    {
      name: "permalink",
      label: "Permalink",
      type: "string",
      description: "Optional custom public URL path. Leave blank to use the filename/slug."
    },
    seoFields,
    {
      type: "object",
      list: true,
      name: "blocks",
      label: "Page Sections",
      description: "The visible content of the page. When the page starts with a Hero block, its Headline is the main on-page heading \xE2\u20AC\u201D edit that to change what visitors see at the top.",
      ui: { visualSelector: true },
      templates: [
        homepageTemplateBlockSchema,
        aboutMockup17BlockSchema,
        ourTeamMockup17BlockSchema,
        contactMockup17BlockSchema,
        heroBlockSchema,
        calloutBlockSchema,
        featuresBlockSchema,
        statsBlockSchema,
        ctaBlockSchema,
        contentBlockSchema,
        testimonialBlockSchema,
        videoBlockSchema,
        splitBlockSchema
      ]
    }
  ]
};

// tina/collections/user.ts
var UserCollection = {
  name: "user",
  label: "Users",
  path: "src/content/user",
  format: "json",
  ui: {
    router({ document }) {
      return `/author/${document._sys.filename}/`;
    }
  },
  fields: [
    {
      type: "string",
      name: "name",
      label: "Name",
      isTitle: true,
      required: true
    },
    {
      type: "string",
      name: "role",
      label: "Role / Title"
    },
    {
      type: "image",
      name: "avatar",
      label: "Avatar"
    },
    {
      type: "string",
      name: "bio",
      label: "Bio",
      ui: {
        component: "textarea"
      }
    },
    {
      type: "string",
      name: "email",
      label: "Email"
    },
    seoFields
  ]
};

// tina/config.ts
var branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.TINA_BRANCH || process.env.PUBLIC_TINA_BRANCH || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.WORKERS_CI_BRANCH || process.env.CF_PAGES_BRANCH || process.env.HEAD || "main";
var config_default = defineConfig({
  contentApiUrlOverride: process.env.TINA_DIRECT_CLOUD_CHECK === "1" ? void 0 : process.env.NEXT_PUBLIC_TINA_CONTENT_API_URL,
  branch,
  // Every independently provisioned site must provide its own Tina project credentials.
  // `validate:site` fails before deployment when these are absent.
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  media: {
    loadCustomStore: async () => {
      const pack = await import("next-tinacms-cloudinary");
      return pack.TinaCloudCloudinaryMediaStore;
    }
  },
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      BlogCollection,
      CategoryCollection,
      PageCollection,
      UserCollection,
      NavigationCollection,
      GlobalConfigCollection
    ]
  }
});
export {
  config_default as default
};
