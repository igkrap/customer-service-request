UPDATE projects AS p
SET license_key = 'PX' || lk.license_key
FROM LATERAL (
    SELECT string_agg(
        CASE
            WHEN ((gs.pos % 2 = 0 AND gs.digit % 2 = 0) OR (gs.pos % 2 = 1 AND gs.digit % 2 = 1))
                THEN chr(65 + gs.digit)
            ELSE gs.digit::text
        END,
        '' ORDER BY gs.pos
    ) AS license_key
    FROM (
        SELECT pos,
               substr(ts, pos, 1)::int AS digit
        FROM (
            SELECT to_char(p.created_at, 'YYYYMMDDHH24MISSMS') AS ts
        ) AS ts_source,
        generate_series(1, length(ts)) AS pos
    ) AS gs
) AS lk
WHERE p.license_key IS NULL;
