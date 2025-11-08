import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let xScaleGlobal = null;
let yScaleGlobal = null;
let commitsGlobal = null;

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: "https://github.com/uzairgheewala/dsc_106/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false,
        configurable: false,
        writable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const container = d3.select("#stats");
  container.selectAll("*").remove();

  const dl = container.append("dl").attr("class", "stats");

  // Total LOC (rows in loc.csv)
  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  // Total commits
  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  // Number of files (distinct d.file)
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append("dt").text("Files");
  dl.append("dd").text(numFiles);

  // Longest file (by max line number)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  const longestFileEntry = d3.greatest(fileLengths, (d) => d[1]);
  if (longestFileEntry) {
    const [fileName, maxLines] = longestFileEntry;
    dl.append("dt").text("Longest file");
    dl.append("dd").text(`${fileName} (${maxLines} lines)`);
  }

  // Average line length in characters
  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append("dt").text("Average line length");
  dl.append("dd").text(`${avgLineLength.toFixed(1)} chars`);

  // Time-of-day with most edits (morning/afternoon/evening/night)
  const periods = d3.rollups(
    data,
    (v) => v.length,
    (d) => {
      const hour = d.datetime.getHours();
      if (hour < 6) return "Night";
      if (hour < 12) return "Morning";
      if (hour < 18) return "Afternoon";
      return "Evening";
    }
  );
  const maxPeriod = d3.greatest(periods, (d) => d[1]);
  if (maxPeriod) {
    const [periodName, count] = maxPeriod;
    dl.append("dt").text("Most active time of day");
    dl.append("dd").text(`${periodName} (${count} lines touched)`);
  }
}

function renderTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const lines = document.getElementById("commit-lines");

  if (!commit) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
  }) ?? "";

  time.textContent = commit.datetime?.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "";

  author.textContent = commit.author ?? "";
  lines.textContent = `${commit.totalLines} line${commit.totalLines === 1 ? "" : "s"}`;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  const offset = 12; // small offset so we don't sit exactly under the cursor
  tooltip.style.left = `${event.clientX + offset}px`;
  tooltip.style.top = `${event.clientY + offset}px`;
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Create SVG
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  xScaleGlobal = xScale;
  yScaleGlobal = yScale;

  // --- Radius scale for "lines edited" ---
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  const rScale = d3.scaleSqrt()           // sqrt so area ~ lines
    .domain([minLines || 1, maxLines || 1])
    .range([3, 30]);                      // tweak if needed

  // Draw larger dots first so small ones stay clickable on top
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  // Gridlines (horizontal)
  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Dots group
  const dots = svg.append("g").attr("class", "dots");

  dots
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", (event) => {
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });

  // --- Brushing ---
  const brush = d3.brush().on("start brush end", brushed);

  svg.call(brush);

  // Bring dots and axes above the overlay so tooltips still work
  svg.selectAll(".dots, .overlay ~ *").raise();
}

function isCommitSelected(selection, commit) {
  if (!selection || !xScaleGlobal || !yScaleGlobal) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScaleGlobal(commit.datetime);
  const cy = yScaleGlobal(commit.hourFrac);

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection && commitsGlobal
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector("#selection-count");
  const n = selected.length;

  countElement.textContent = n
    ? `${n} commit${n === 1 ? "" : "s"} selected`
    : "No commits selected";

  return selected;
}

function renderLanguageBreakdown(selection) {
  const container = document.getElementById("language-breakdown");
  container.innerHTML = "";

  if (!commitsGlobal) return;

  const selectedCommits = selection
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];

  if (selectedCommits.length === 0) {
    // nothing selected: show nothing (or overall breakdown if you want)
    return;
  }

  const lines = selectedCommits.flatMap(d => d.lines || []);

  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll("circle").classed("selected", d =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// main
const data = await loadData();
const commits = processCommits(data);

commitsGlobal = commits;

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
