console.log("IT’S ALIVE!");

//import { $$ } from "/dsc_106/global.js"; // self-import is a no-op in modern bundlers but safe to omit;
// we already exported $$ above; we can just use it directly since we're in the same module.

/** $$: querySelectorAll → real Array */
// export function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }

const $$ = (selector, context = document) =>
  Array.from((context || document).querySelectorAll(selector));

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

// === Step 4.2: inject the theme switcher INSIDE the nav ===
(function addColorSchemeSwitcher() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  const label = document.createElement("label");
  label.className = "color-scheme";
  label.innerHTML = `
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  `;
  nav.append(label); // put it at the end, aligned right via CSS
})();

// === Step 4.4/4.5: make it work + persist ===
(function wireColorScheme() {
  const select = document.querySelector(".color-scheme select");
  if (!select) return;

  const setColorScheme = (value) => {
    // override on <html>
    document.documentElement.style.setProperty("color-scheme", value);
  };

  const saved = localStorage.getItem("colorScheme");
  if (saved) {
    setColorScheme(saved);
    select.value = saved;
  } else {
    select.value = "light dark"; // auto
  }

  // Use 'change' for selects
  select.addEventListener("change", (event) => {
    const value = event.target.value; // "light dark" | "light" | "dark"
    setColorScheme(value);
    localStorage.setItem("colorScheme", value);
  });
})();

// Step 5 (optional): intercept contact form submit and build a properly encoded mailto URL
(function enhanceContactForm() {
  const form = document.querySelector("form[action^='mailto:']");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const params = [];
    for (const [name, value] of data) {
      // Build query params with percent-encoding for universal compatibility
      params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    }

    const base = form.getAttribute("action"); // e.g. "mailto:you@example.com"
    const url = `${base}?${params.join("&")}`;
    // Open the mail client
    location.href = url;
  });
})();

// ---------- Lab 4: data utilities ----------
export async function fetchJSON(url) {
  try {
    const response = await fetch(url, { headers: { "Accept": "application/json" }});
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching or parsing JSON:", err);
    return null; // caller can handle null
  }
}

/**
 * Render a list of projects into a container.
 * @param {Array<Object>} projects - [{title,year,image,description}, ...]
 * @param {HTMLElement} container - where to render
 * @param {string} headingLevel - "h2" | "h3" | ...
 */
export function renderProjects(projects, container, headingLevel = "h2") {
  if (!container) {
    console.warn("renderProjects: container not found");
    return;
  }
  // Basic validation
  const validHeading = /^h[1-6]$/.test(headingLevel) ? headingLevel : "h2";

  container.innerHTML = ""; // clear previous content

  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = `<p>No projects to display yet.</p>`;
    return;
  }

  for (const p of projects) {
    const article = document.createElement("article");
    const safeTitle = p?.title ?? "Untitled Project";
    const safeImg   = p?.image ?? "https://vis-society.github.io/labs/2/images/empty.svg";
    const safeDesc  = p?.description ?? "";

    article.innerHTML = `
      <${validHeading}>${safeTitle}</${validHeading}>
      <img src="${safeImg}" alt="${safeTitle}">
      <p>${safeDesc}</p>
    `;
    container.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  if (!username) return null;
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}

// Count public PRs by author using the Search API (public only)
export async function fetchGitHubPublicPRCount(username) {
  const url = `https://api.github.com/search/issues?q=is:pr+author:${encodeURIComponent(username)}`;
  const data = await fetchJSON(url);
  return data?.total_count ?? null; // number (public PRs), or null on error
}

// Render the GitHub contributions heatmap SVG (public profile endpoint)
export function renderContributionsHeatmap(username, container) {
  if (!container) return;
  container.innerHTML = `
    <h2>Contributions (past year)</h2>
    <img
      src="https://ghchart.rshah.org/${encodeURIComponent(username)}"
      alt="GitHub contributions heatmap for ${username} in the last year"
      style="max-width:100%; height:auto; display:block;"
      loading="lazy"
      decoding="async"
    >
  `;
}