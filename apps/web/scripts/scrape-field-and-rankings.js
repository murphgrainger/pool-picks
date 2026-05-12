// One-off CLI script: fetch ESPN field for a tournament + global rankings,
// upsert athletes / AthletesInTournaments, update rankings.
// Mirrors apps/web/src/app/api/scrape/{tournaments/[id]/athletes,rankings}/route.ts
// but skips the Supabase admin auth check so it can run from CLI.
//
// Usage:
//   node --env-file=../../.env apps/web/scripts/scrape-field-and-rankings.js "Truist Championship"

const { PrismaClient } = require("@prisma/client");
const cheerio = require("cheerio");

const ESPN_API_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const RANKINGS_URL = "https://www.espn.com/golf/rankings";

const prisma = new PrismaClient();

async function fetchField(externalId) {
  const url = `${ESPN_API_BASE}/${externalId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN scoreboard returned ${res.status}`);
  const raw = await res.json();
  const event = raw.events ? raw.events[0] : raw;
  if (event.id !== String(externalId)) {
    throw new Error(
      "ESPN didn't return the requested event — field may not be announced yet."
    );
  }
  const competitors = event.competitions?.[0]?.competitors ?? [];
  return competitors
    .map((c) => c.athlete?.fullName)
    .filter((n) => typeof n === "string" && n.length > 0);
}

async function upsertField(tournamentId, names) {
  let athletes = 0;
  let links = 0;
  for (const fullName of names) {
    const a = await prisma.athlete.upsert({
      where: { full_name: fullName },
      create: { full_name: fullName },
      update: {},
    });
    athletes++;
    await prisma.athletesInTournaments.upsert({
      where: {
        tournament_id_athlete_id: {
          tournament_id: tournamentId,
          athlete_id: a.id,
        },
      },
      create: { tournament_id: tournamentId, athlete_id: a.id },
      update: {},
    });
    links++;
  }
  return { athletes, links };
}

async function fetchRankings() {
  const res = await fetch(RANKINGS_URL);
  if (!res.ok) throw new Error(`ESPN rankings returned ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const out = [];
  $(".Table.Table--align-right.Table--fixed.Table--fixed-left tbody tr").each(
    (_i, el) => {
      const ranking = parseInt($(el).find(".rank_column span").text(), 10);
      const fullName = $(el).find(".flex .AnchorLink").text();
      if (fullName && ranking) out.push({ full_name: fullName, ranking });
    }
  );
  return out;
}

async function applyRankings(rows) {
  let updated = 0;
  let notFound = 0;
  const missing = [];
  for (const r of rows) {
    const result = await prisma.athlete.updateMany({
      where: { full_name: r.full_name },
      data: { ranking: r.ranking },
    });
    if (result.count > 0) updated++;
    else {
      notFound++;
      if (missing.length < 10) missing.push(r.full_name);
    }
  }
  return { updated, notFound, missing };
}

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error('Usage: node scrape-field-and-rankings.js "<tournament name fragment>"');
    process.exit(1);
  }

  console.log(`Target Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Tournament filter: "${query}"`);
  console.log("");

  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: query, mode: "insensitive" } },
  });
  if (!tournament) {
    console.error(`No tournament matching "${query}" found.`);
    const all = await prisma.tournament.findMany({
      select: { id: true, name: true, external_id: true },
      orderBy: { start_date: "asc" },
    });
    console.error("Tournaments in DB:");
    for (const t of all) {
      console.error(`  ${t.id}: ${t.name} (external_id: ${t.external_id})`);
    }
    process.exit(1);
  }
  if (!tournament.external_id) {
    console.error(
      `Tournament "${tournament.name}" has no external_id — can't fetch field.`
    );
    process.exit(1);
  }
  console.log(
    `Matched: id=${tournament.id} "${tournament.name}" (external_id ${tournament.external_id})`
  );
  console.log("");

  console.log("[1/2] Field");
  const names = await fetchField(tournament.external_id);
  console.log(`  ESPN returned ${names.length} athletes`);
  const fieldResult = await upsertField(tournament.id, names);
  console.log(
    `  Upserted ${fieldResult.athletes} athletes, ${fieldResult.links} tournament links.`
  );
  console.log("");

  console.log("[2/2] Rankings");
  const rows = await fetchRankings();
  console.log(`  ESPN returned ${rows.length} ranked players`);
  const rankResult = await applyRankings(rows);
  console.log(
    `  Updated ${rankResult.updated}, ${rankResult.notFound} ranked players not in DB.`
  );
  if (rankResult.missing.length) {
    console.log(`  First few missing: ${rankResult.missing.join(", ")}`);
  }
  console.log("");
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
