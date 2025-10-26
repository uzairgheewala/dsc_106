import {
  fetchJSON,
  renderProjects,
  fetchGitHubData,
  fetchGitHubPublicPRCount,
  renderContributionsHeatmap
} from "./global.js";

const GITHUB_USER = "uzairgheewala"; // <-- set me

// Latest projects (unchanged)
(async function renderLatest() {
  const projects = await fetchJSON("./lib/projects.json");
  const latest = Array.isArray(projects) ? projects.slice(0, 3) : [];
  const container = document.querySelector(".projects");
  if (container) renderProjects(latest, container, "h3");
})();

// GitHub stats + PRs + heatmap
(async function renderGitHub() {
  const profileStats = document.querySelector("#profile-stats");
  const heatmap = document.querySelector("#contrib-heatmap");

  // Heatmap first (doesn't require API JSON)
  if (heatmap) {
    renderContributionsHeatmap(GITHUB_USER, heatmap);
  }

  if (!profileStats) return;

  const [data, prCount] = await Promise.all([
    fetchGitHubData(GITHUB_USER),            // public profile stats
    fetchGitHubPublicPRCount(GITHUB_USER)    // public PR count
  ]);

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
      <dt>Public PRs</dt><dd>${prCount ?? "—"}</dd>
    </dl>
  `;
})();