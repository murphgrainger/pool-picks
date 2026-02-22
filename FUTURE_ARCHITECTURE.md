# Future Architecture: Tournament Series vs Instance

## Problem

The current `Tournament` model stores both the recurring event identity (e.g., "Masters Tournament") and the specific yearly occurrence (2023, 2024, 2025) in the same row. This leads to:

- Name collisions when scraping the same tournament across multiple years
- No clean way to compare a pool's performance year-over-year for the same event
- Difficulty distinguishing between "the Masters" as a concept vs "the 2026 Masters"

## Proposed Schema

### TournamentSeries

Represents a recurring PGA Tour event.

```prisma
model TournamentSeries {
  id          Int                  @id @default(autoincrement())
  created_at  DateTime             @default(now())
  updated_at  DateTime             @updatedAt
  name        String               @unique   // "Masters Tournament", "THE PLAYERS Championship"
  slug        String               @unique   // "masters-tournament"
  instances   TournamentInstance[]
}
```

### TournamentInstance (renamed from Tournament)

Represents a specific yearly occurrence of a series.

```prisma
model TournamentInstance {
  id          Int                    @id @default(autoincrement())
  created_at  DateTime               @default(now())
  updated_at  DateTime               @updatedAt
  season      Int                    // 2026
  start_date  DateTime               @db.Date
  end_date    DateTime               @db.Date
  course      String
  city        String
  region      String
  status      String                 @default("Scheduled")
  cut_line    Int?
  external_id Int?                   @unique  // ESPN tournamentId
  series_id   Int
  series      TournamentSeries       @relation(fields: [series_id], references: [id])
  athletes    AthletesInTournaments[]
  pools       Pool[]

  @@unique([series_id, season])
}
```

## Benefits

- **Year-over-year comparison**: Query all instances of a series to compare across years
- **Cleaner scraping**: Upsert by `external_id` on the instance, link to series by name
- **Better UX**: Show "Masters Tournament (2026)" in selectors, group by series in history views
- **No name collisions**: Series name is unique, instances are unique by `[series_id, season]`

## Migration Path

1. Create `TournamentSeries` table
2. Deduplicate existing tournaments by name → create one series per unique name
3. Rename `Tournament` → `TournamentInstance`, add `series_id` FK
4. Update all references (Pool, AthletesInTournaments, scraper routes)
