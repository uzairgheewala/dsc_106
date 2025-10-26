console.log("IT’S ALIVE!");

import { $$ } from "/dsc_106/global.js"; // self-import is a no-op in modern bundlers but safe to omit;
// we already exported $$ above; we can just use it directly since we're in the same module.

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

/** $$: querySelectorAll → real Array */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}