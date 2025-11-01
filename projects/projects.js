import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// ---------- Load data and list ----------
let projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
renderProjects(projects ?? [], projectsContainer, "h2");

// Update Projects (N) count
const titleEl = document.querySelector(".projects-title");
if (titleEl && Array.isArray(projects)) {
  titleEl.textContent = `${titleEl.textContent.replace(/\s*\(\d+\)$/, "")} (${projects.length})`;
}

// ---------- PIE: reusable renderer over data ----------
const svg = d3.select("#projects-pie-plot");
const legend = d3.select(".legend");
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function rollupProjectsByYear(list) {
  const r = d3.rollups(
    list,
    v => v.length,
    d => d.year
  ); // e.g. [["2024", 3], ...]
  // sort by year (desc)
  r.sort((a, b) => Number(b[0]) - Number(a[0]));
  return r.map(([year, count]) => ({ label: String(year), value: count }));
}

let selectedYear = null; // NEW: year string or null
let selectedIndex = -1; // -1 = none selected
let lastData = [];      // keep last rolled data for clicks

function renderPieFromData(list) {
  svg.selectAll("path").remove();
  legend.selectAll("*").remove();

  const data = rollupProjectsByYear(list);
  lastData = data;
  if (data.length === 0) return;

  // NEW: map selectedYear -> selectedIndex in the current data
  selectedIndex =
    selectedYear == null
      ? -1
      : data.findIndex(d => String(d.label) === String(selectedYear));

  const arcGen = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGen = d3.pie().value(d => d.value);
  const slices = sliceGen(data);
  const arcs = slices.map(d => arcGen(d));

  arcs.forEach((d, i) => {
    svg
      .append("path")
      .attr("d", d)
      .attr("fill", colors(i))
      .classed("selected", i === selectedIndex)
      .on("click", () => {
        if (selectedIndex === i) {
          selectedIndex = -1;
          selectedYear = null;
        } else {
          selectedIndex = i;
          selectedYear = data[i].label; // NEW: store the year
        }
        applyYearFilterAndRerender();
      });
  });

  data.forEach((d, i) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(i)}`)
      .classed("selected", i === selectedIndex)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        if (selectedIndex === i) {
          selectedIndex = -1;
          selectedYear = null;
        } else {
          selectedIndex = i;
          selectedYear = d.label; // NEW
        }
        applyYearFilterAndRerender();
      });
  });
}

function applyYearFilterAndRerender() {
  const filteredByQuery = filterByQuery(projects ?? [], query);

  const result =
    selectedYear == null
      ? filteredByQuery
      : filteredByQuery.filter(p => String(p.year) === String(selectedYear));

  // re-render list with both filters (query + selected year)
  renderProjects(result, projectsContainer, "h2");

  // re-render pie from query-filtered set (context stays visible)
  renderPieFromData(filteredByQuery);
}

// initial render with full list
renderPieFromData(projects ?? []);

let query = "";
const searchInput = document.querySelector(".searchBar");

function filterByQuery(list, q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return list;
  return list.filter(p => {
    const all = Object.values(p).join("\n").toLowerCase();
    return all.includes(ql);
  });
}

function renderAll() {
  const filtered = filterByQuery(projects ?? [], query);
  renderProjects(filtered, projectsContainer, "h2");
  renderPieFromData(filtered);
}

searchInput?.addEventListener("input", (e) => {
  query = e.target.value;
  renderAll();
});

// first reactive render
renderAll();