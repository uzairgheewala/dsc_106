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

// ---------- PIE: basic static demo ----------
const svg = d3.select("#projects-pie-plot");
const legend = d3.select(".legend");

// simple data
let demoData = [1, 2]; // 33% / 66%
const arcGen = d3.arc().innerRadius(0).outerRadius(50);
const sliceGen = d3.pie(); // uses values directly
const slices = sliceGen(demoData); // [{startAngle,endAngle,value}, …]
const arcs = slices.map(d => arcGen(d));

// color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// draw arcs
arcs.forEach((d, i) => {
  svg.append("path").attr("d", d).attr("fill", colors(i));
});

// ----- Legend for the demo data -----
legend.selectAll("*").remove();
demoData.forEach((val, i) => {
  legend
    .append("li")
    .attr("style", `--color:${colors(i)}`)
    .html(`<span class="swatch"></span> Slice ${i + 1} <em>(${val})</em>`);
});