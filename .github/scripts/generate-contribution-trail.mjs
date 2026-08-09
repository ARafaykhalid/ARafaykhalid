import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [owner = process.env.GITHUB_REPOSITORY_OWNER, outputDirectory = "dist"] =
  process.argv.slice(2).filter((argument) => argument !== "--demo");
const demoMode = process.argv.includes("--demo");

if (!owner) {
  throw new Error("Pass a GitHub username as the first argument.");
}

const CELL_SIZE = 8;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const GRID_X = 34;
const GRID_Y = 22;
const DURATION_SECONDS = 30;

// Change the snake colors here. Both SVG variants are generated from these
// local palettes, so the README never falls back to GitHub's green/purple
// defaults or to a snake hosted in somebody else's repository.
const themes = {
  light: {
    surface: "#f7f7f7",
    empty: "#e7e9f2",
    border: "#0011ff",
    grid: "#0011ff",
    levels: ["#d9ddff", "#9aa5ff", "#5263ff", "#0011ff"],
    snake: "#0011ff",
    snakeFace: "#f7f7f7",
    snakeDetail: "#5263ff",
    snakeInk: "#050505",
    progressTrack: "#9aa5ff",
  },
  dark: {
    surface: "#171923",
    empty: "#f1f2f5",
    border: "#0011ff",
    grid: "#5263ff",
    levels: ["#d9ddff", "#9aa5ff", "#5263ff", "#0011ff"],
    snake: "#0011ff",
    snakeFace: "#f7f7f7",
    snakeDetail: "#9aa5ff",
    snakeInk: "#050505",
    progressTrack: "#5263ff",
  },
};

const contributionCalendar = demoMode
  ? createDemoCalendar()
  : await fetchContributionCalendar(owner, process.env.GITHUB_TOKEN);

const outputPath = resolve(outputDirectory);
await mkdir(outputPath, { recursive: true });

await Promise.all([
  writeFile(
    resolve(outputPath, "github-snake-blue.svg"),
    renderSvg(contributionCalendar, themes.light, "light"),
  ),
  writeFile(
    resolve(outputPath, "github-snake-blue-dark.svg"),
    renderSvg(contributionCalendar, themes.dark, "dark"),
  ),
]);

async function fetchContributionCalendar(login, token) {
  if (!token) {
    throw new Error("GITHUB_TOKEN is required outside demo mode.");
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "ARafayKhalid-contribution-trail",
    },
    body: JSON.stringify({
      query: `
        query ContributionCalendar($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    weekday
                  }
                }
              }
            }
          }
        }
      `,
      variables: { login },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map(({ message }) => message).join("; "));
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    throw new Error(`No public contribution calendar found for ${login}.`);
  }

  return calendar;
}

function createDemoCalendar() {
  const start = new Date("2025-08-03T00:00:00Z");
  const weeks = Array.from({ length: 53 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + weekIndex * 7 + weekday);
      const signal =
        (weekIndex * 17 + weekday * 11 + (weekIndex % 9) * weekday) % 23;
      return {
        contributionCount: signal > 14 ? (signal % 8) + 1 : 0,
        date: date.toISOString().slice(0, 10),
        weekday,
      };
    }),
  }));

  return {
    totalContributions: weeks
      .flatMap(({ contributionDays }) => contributionDays)
      .reduce((total, { contributionCount }) => total + contributionCount, 0),
    weeks,
  };
}

function renderSvg(calendar, theme, colorScheme) {
  const weeks = calendar.weeks.slice(-53);
  const days = weeks.flatMap(({ contributionDays }, weekIndex) =>
    contributionDays.map((day) => ({ ...day, weekIndex })),
  );
  const activeCounts = days
    .map(({ contributionCount }) => contributionCount)
    .filter(Boolean)
    .sort((a, b) => a - b);
  const thresholds = [0.25, 0.5, 0.75].map(
    (percentile) => activeCounts[Math.floor((activeCounts.length - 1) * percentile)] ?? 0,
  );
  const routePoints = createRoutePoints(weeks.length);
  const route = routePoints
    .map(({ x, y }, index) => `${index ? "L" : "M"}${x} ${y}`)
    .join(" ");
  const routeIndex = new Map(
    routePoints.map(({ weekIndex, weekday }, index) => [
      `${weekIndex}:${weekday}`,
      index,
    ]),
  );
  const lastRouteIndex = Math.max(routePoints.length - 1, 1);

  const contributionCells = days
    .map((day) => {
      const x = GRID_X + day.weekIndex * CELL_STEP;
      const y = GRID_Y + day.weekday * CELL_STEP;
      const emptyCell = `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="3" fill="${theme.empty}" stroke="${theme.border}" stroke-opacity=".08"/>`;

      if (!day.contributionCount) {
        return emptyCell;
      }

      const level = Math.min(
        3,
        thresholds.filter((threshold) => day.contributionCount > threshold).length,
      );
      const visitIndex = routeIndex.get(`${day.weekIndex}:${day.weekday}`) ?? 0;
      const visitProgress = Math.max(
        0.001,
        Math.min(0.985, visitIndex / lastRouteIndex),
      );
      const disappearProgress = Math.min(0.99, visitProgress + 0.004);

      return `${emptyCell}<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="3" fill="${theme.levels[level]}">
        <title>${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}</title>
        <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${visitProgress.toFixed(4)};${disappearProgress.toFixed(4)};.994;1" dur="${DURATION_SECONDS}s" repeatCount="indefinite"/>
      </rect>`;
    })
    .join("");

  const gridWidth = Math.max(weeks.length, 1) * CELL_STEP - CELL_GAP;
  return `<svg viewBox="0 0 720 160" width="720" height="160" role="img" aria-labelledby="title description" xmlns="http://www.w3.org/2000/svg">
  <title id="title">${escapeXml(owner)}'s animated GitHub contribution trail (${colorScheme})</title>
  <desc id="description">Rafay's neon-blue character moves through the blue contribution calendar and clears each active contribution cell.</desc>
  <defs>
    <pattern id="background-grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${theme.grid}" stroke-opacity=".035"/>
    </pattern>
    <path id="mascot-route" d="${route}"/>
    <filter id="mascot-shadow" x="-80%" y="-80%" width="260%" height="260%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="${theme.snake}" flood-opacity=".35"/>
    </filter>
    <style>
      .mono{font-family:"Cascadia Code","SFMono-Regular",Consolas,"Liberation Mono",monospace}
      .mascot-bob{animation:bob 1.1s ease-in-out infinite;transform-origin:center}
      .mascot-eyes{animation:blink 4.6s steps(1,end) infinite;transform-box:fill-box;transform-origin:center}
      .signal{animation:pulse 1.8s ease-in-out infinite}
      @keyframes bob{0%,100%{transform:translateY(-1px)}50%{transform:translateY(1px)}}
      @keyframes blink{0%,46%,54%,100%{transform:scaleY(1)}49%,51%{transform:scaleY(.12)}}
      @keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
      @media(prefers-reduced-motion:reduce){.mascot-bob,.mascot-eyes,.signal{animation:none}}
    </style>
  </defs>

  <rect width="720" height="160" fill="${theme.surface}"/>
  <rect width="720" height="160" fill="url(#background-grid)"/>

  <g>${contributionCells}</g>

  <g opacity=".62" fill="none" stroke="${theme.snake}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <use href="#mascot-route"/>
  </g>

  <g filter="url(#mascot-shadow)">
    <animateMotion dur="${DURATION_SECONDS}s" repeatCount="indefinite" rotate="0">
      <mpath href="#mascot-route"/>
    </animateMotion>
    <g class="mascot-bob" transform="translate(-18 -16) scale(1.8)">
      <path d="M1.2 5 3.4 2.4h11.4l2.6 3v8.8l-2.5 2.5H3.5C1.9 16.5.8 15.4.8 13.8V7c0-.8.1-1.4.4-2Z" fill="${theme.snake}"/>
      <path d="M3.2 2.2h10.9c1.5 0 2.8 1.2 2.8 2.8v8.4c0 1.5-1.2 2.7-2.7 2.7H4c-1.5 0-2.7-1.2-2.7-2.7V5.1c0-1.1.7-2.2 1.9-2.9Z" fill="${theme.snakeFace}" stroke="${theme.snake}" stroke-width="1.35"/>
      <path d="M4.2 5 6.1 3.1M4.2 5l2.5 2.6M14.3 3.8l1.4 1.8M15.9 12.7l-2.3-2.4M4.8 14.2 7 12" fill="none" stroke="${theme.snakeDetail}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="mascot-eyes">
        <ellipse cx="7.3" cy="8.2" rx="1.15" ry="1.8" fill="${theme.snakeFace}"/>
        <ellipse cx="12.4" cy="8.2" rx="1.15" ry="1.8" fill="${theme.snakeFace}"/>
        <ellipse cx="7.5" cy="8.3" rx=".36" ry=".82" fill="${theme.snakeInk}"/>
        <ellipse cx="12.6" cy="8.3" rx=".36" ry=".82" fill="${theme.snakeInk}"/>
      </g>
      <path d="m9.8 6.6 1.15 2.6-.8 1.3" fill="none" stroke="${theme.snakeDetail}" stroke-width="1.35" stroke-linecap="round"/>
      <path d="M9 12.7c.9.8 2 .8 2.9 0" fill="none" stroke="${theme.snakeInk}" stroke-width=".72" stroke-linecap="round"/>
    </g>
  </g>

  <path d="M${GRID_X} 134H${GRID_X + gridWidth}" stroke="${theme.progressTrack}" stroke-opacity=".35" stroke-width="8" stroke-linecap="butt"/>
  <rect x="${GRID_X}" y="130" width="${gridWidth}" height="8" fill="${theme.snake}">
    <animate attributeName="width" values="0;${gridWidth};${gridWidth};0" keyTimes="0;.94;.994;1" dur="${DURATION_SECONDS}s" repeatCount="indefinite"/>
  </rect>
</svg>`;
}

function createRoutePoints(weekCount) {
  return Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekdays = weekIndex % 2 === 0
      ? [0, 1, 2, 3, 4, 5, 6]
      : [6, 5, 4, 3, 2, 1, 0];

    return weekdays.map((weekday) => ({
      weekIndex,
      weekday,
      x: GRID_X + weekIndex * CELL_STEP + CELL_SIZE / 2,
      y: GRID_Y + weekday * CELL_STEP + CELL_SIZE / 2,
    }));
  }).flat();
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
