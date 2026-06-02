-- Ensure one board per project
INSERT INTO "Board" ("id", "projectId", "createdAt", "updatedAt")
SELECT CONCAT('board_', SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text || p."id") FROM 1 FOR 24)),
       p."id",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "Project" p
LEFT JOIN "Board" b ON b."projectId" = p."id"
WHERE b."id" IS NULL;

-- Ensure default workflow columns exist for every project board
INSERT INTO "BoardColumn" ("id", "boardId", "name", "order", "wipLimit", "type", "createdAt", "updatedAt")
SELECT CONCAT('col_', SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text || b."id" || c."type") FROM 1 FOR 24)),
       b."id",
       c."name",
       c."order",
       c."wipLimit",
       c."type"::"BoardColumnType",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "Board" b
CROSS JOIN (
  VALUES
    ('Backlog', 0, NULL, 'BACKLOG'),
    ('Todo', 1, NULL, 'TODO'),
    ('In Progress', 2, 6, 'IN_PROGRESS'),
    ('Review', 3, 5, 'REVIEW'),
    ('Done', 4, NULL, 'DONE'),
    ('Blocked', 5, 4, 'BLOCKED')
) AS c("name", "order", "wipLimit", "type")
ON CONFLICT ("boardId", "name") DO UPDATE
SET
  "order" = EXCLUDED."order",
  "wipLimit" = EXCLUDED."wipLimit",
  "type" = EXCLUDED."type",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Ensure task -> board relation is filled
UPDATE "Task" t
SET "boardId" = b."id"
FROM "Board" b
WHERE t."projectId" = b."projectId"
  AND t."boardId" IS NULL;

-- Backfill boardColumnId from persisted state/status fallback
UPDATE "Task" t
SET "boardColumnId" = target."id"
FROM LATERAL (
  SELECT bc."id"
  FROM "Board" b
  INNER JOIN "BoardColumn" bc ON bc."boardId" = b."id"
  WHERE b."projectId" = t."projectId"
    AND bc."type" = CASE UPPER(COALESCE(t."status"::text, t."state"::text, 'BACKLOG'))
      WHEN 'TODO' THEN 'TODO'::"BoardColumnType"
      WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::"BoardColumnType"
      WHEN 'REVIEW' THEN 'REVIEW'::"BoardColumnType"
      WHEN 'DONE' THEN 'DONE'::"BoardColumnType"
      WHEN 'BLOCKED' THEN 'BLOCKED'::"BoardColumnType"
      ELSE 'BACKLOG'::"BoardColumnType"
    END
  ORDER BY bc."order" ASC, bc."createdAt" ASC
  LIMIT 1
) AS target
WHERE t."boardColumnId" IS NULL;

-- Remove legacy indexes and columns
DROP INDEX IF EXISTS "Task_projectId_state_idx";
DROP INDEX IF EXISTS "Task_projectId_status_idx";

ALTER TABLE "Task"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "state";
