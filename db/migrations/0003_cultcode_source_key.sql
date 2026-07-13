WITH parsed_culture_codes AS (
  SELECT
    id,
    is_active,
    source_key,
    substr(
      substr(homepage_address, instr(homepage_address, 'cultcode=') + 9),
      1,
      CASE
        WHEN instr(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9), '&') > 0
          THEN instr(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9), '&') - 1
        ELSE length(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9))
      END
    ) AS culture_code
  FROM cultures
  WHERE homepage_address IS NOT NULL
    AND instr(homepage_address, 'cultcode=') > 0
), ranked_culture_codes AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY culture_code
      ORDER BY is_active DESC, (source_key IS NOT NULL) DESC, id ASC
    ) AS row_rank
  FROM parsed_culture_codes
  WHERE culture_code <> ''
    AND culture_code NOT GLOB '*[^0-9]*'
)
DELETE FROM cultures
WHERE id IN (
  SELECT id
  FROM ranked_culture_codes
  WHERE row_rank > 1
);

WITH parsed_culture_codes AS (
  SELECT
    id,
    substr(
      substr(homepage_address, instr(homepage_address, 'cultcode=') + 9),
      1,
      CASE
        WHEN instr(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9), '&') > 0
          THEN instr(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9), '&') - 1
        ELSE length(substr(homepage_address, instr(homepage_address, 'cultcode=') + 9))
      END
    ) AS culture_code
  FROM cultures
  WHERE homepage_address IS NOT NULL
    AND instr(homepage_address, 'cultcode=') > 0
)
UPDATE cultures
SET source_key = (
  SELECT 'culture:seoul:' || parsed_culture_codes.culture_code
  FROM parsed_culture_codes
  WHERE parsed_culture_codes.id = cultures.id
)
WHERE id IN (
  SELECT id
  FROM parsed_culture_codes
  WHERE culture_code <> ''
    AND culture_code NOT GLOB '*[^0-9]*'
);

DELETE FROM culture_sync_staging;
