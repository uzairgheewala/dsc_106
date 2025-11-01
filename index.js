import {
  fetchJSON,
  renderProjects,
  fetchGitHubData,
  fetchGitHubPublicPRCount,
  renderContributionsHeatmap
} from "./global.js";

const GITHUB_USER = "uzairgheewala"; 

// Latest projects (by year, descending)
(async function renderLatest() {
  const projects = await fetchJSON("./lib/projects.json");
  const container = document.querySelector(".projects");
  if (!container || !Array.isArray(projects)) return;

  const latest = projects
    .map((p, idx) => ({
      ...p,
      _idx: idx,
      _year: Number(p.year) || Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => (b._year - a._year) || (a._idx - b._idx)) // year desc, then stable by original order
    .slice(0, 3)
    .map(({ _idx, _year, ...rest }) => rest); // strip helpers

  renderProjects(latest, container, "h3");
})();

// GitHub stats + PRs + heatmap
(async function renderGitHub() {
  const profileStats = document.querySelector("#profile-stats");
  const heatmap = document.querySelector("#contrib-heatmap");

  // Heatmap
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