import { fetchJSON, renderProjects } from "../global.js";

(async function initProjectsPage() {
  // 1) fetch data
  const projects = await fetchJSON("../lib/projects.json");

  // 2) find container
  const container = document.querySelector(".projects");

  // 3) render
  renderProjects(projects ?? [], container, "h2");

  // 4) Step 1.6: update count in the page title if present
  const titleEl = document.querySelector(".projects-title");
  if (titleEl && Array.isArray(projects)) {
    // e.g., <h1 class="projects-title">Projects</h1> -> "Projects (12)"
    titleEl.textContent = `${titleEl.textContent.replace(/\s*\(\d+\)$/, "")} (${projects.length})`;
  }
})();