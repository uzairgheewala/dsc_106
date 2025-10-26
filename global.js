console.log("IT’S ALIVE!");

import { $$ } from "/dsc_106/global.js"; // self-import is a no-op in modern bundlers but safe to omit;
// we already exported $$ above; we can just use it directly since we're in the same module.

/** $$: querySelectorAll → real Array */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2: automatic current page link (for Lab 2 hard-coded nav)
(function currentLinkHighlight() {
  const navLinks = $$("nav a");
  // 2.2 find the link to the current page
  const currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
  );
  // 2.3 add the class (using optional chaining to avoid errors)
  currentLink?.classList.add("current");
})();

// Step 3: automatic navigation menu
(function buildNav() {
  // Pages data (relative URLs)
  const pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "cv/", title: "CV" },
    { url: "https://github.com/uzairgheewala", title: "GitHub" },
  ];

  // Detect local vs GitHub Pages (project name: dsc_106)
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const BASE_PATH = isLocal ? "/" : "/dsc_106/"; // adjust if you rename the repo

  // Create <nav> and prepend to <body>
  const nav = document.createElement("nav");
  document.body.prepend(nav);

  // Create links as real elements (more control)
  for (const p of pages) {
    let url = p.url;
    // prefix internal (non-http) links with base path
    if (!url.startsWith("http")) url = BASE_PATH + url;

    const a = document.createElement("a");
    a.href = url;
    a.textContent = p.title;

    // Highlight current page
    a.classList.toggle(
      "current",
      a.host === location.host && a.pathname === location.pathname
    );

    // Open external links in new tab
    a.toggleAttribute("target", a.host !== location.host);
    if (a.hasAttribute("target")) a.setAttribute("rel", "noopener");

    nav.append(a);
  }
})();