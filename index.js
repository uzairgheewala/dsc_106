import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

// Latest projects
(async function renderLatest() {
  const projects = await fetchJSON("./lib/projects.json");
  const latest = Array.isArray(projects) ? projects.slice(0, 3) : [];
  const container = document.querySelector(".projects");
  if (container) renderProjects(latest, container, "h3");
})();

// GitHub stats (filled in Step 3)
(async function renderGitHub() {
  const profileStats = document.querySelector("#profile-stats");
  if (!profileStats) return;

  const data = await fetchGitHubData("YOUR_GITHUB_USERNAME"); // <-- set yours
  if (!data) {
    profileStats.textContent = "Unable to load GitHub profile data.";
    return;
  }

  profileStats.innerHTML = `
    <h2>GitHub Profile</h2>
    <dl class="stats">
      <dt>Public Repos</dt><dd>${data.public_repos}</dd>
      <dt>Public Gists</dt><dd>${data.public_gists}</dd>
      <dt>Followers</dt><dd>${data.followers}</dd>
      <dt>Following</dt><dd>${data.following}</dd>
    </dl>
  `;
})();