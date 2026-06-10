-- ============================================================================
-- Full roster overhaul — run ONCE in the Supabase SQL editor.
-- (New query > paste > Run.) Assumes the DB is still on the original seed.
-- Safe to re-run: column adds use IF NOT EXISTS, inserts are guarded by name,
-- updates are keyed by name.
--
-- Covers:
--   * Junior round-robin (points/games ladder)
--   * Teacher teams (is_teacher: admin-only, hidden, slot-able into any match)
--   * Year 11 cohort (senior bracket, matches flagged is_next_term / "TBC Next Term")
-- ============================================================================

begin;

-- 1) New columns ------------------------------------------------------------
alter table teams   add column if not exists points        int     not null default 0;
alter table teams   add column if not exists games_played  int     not null default 0;
alter table teams   add column if not exists is_teacher    boolean not null default false;
alter table matches add column if not exists is_next_term  boolean not null default false;

-- 2) Existing junior teams: real names already match; set standings + year/skill.
update teams set points=5, games_played=1, year_group='Year 10', skill_level=1, status='active' where name='DIGGERS HC';
update teams set points=8, games_played=2, year_group='Year 10', skill_level=1, status='active' where name='Ball Ticklers';
update teams set points=2, games_played=1, year_group='Year 10', skill_level=2, status='active' where name='Static';
update teams set points=5, games_played=1, year_group='Year 10', skill_level=5, status='active' where name='wesh';
update teams set points=0, games_played=0, year_group='Year 9',  skill_level=5, status='active' where name='Northside';
update teams set points=1, games_played=1, year_group='Year 9',  skill_level=3, status='active' where name='Sorianna';
update teams set points=2, games_played=1, year_group='Year 9',  skill_level=2, status='active' where name='The HH';
update teams set points=5, games_played=1, year_group='Year 8',  skill_level=3, status='active' where name='Jai Lung';
update teams set points=0, games_played=0, year_group='Year 8',  skill_level=5, status='active' where name='Daisy';

-- 3) Reclassify Year 9 Mum & Dad from the junior pool to a teacher team.
update teams set is_teacher=true, year_group='Teacher', status='active' where name='Year 9 Mum & Dad';

-- 4) New JUNIOR teams (round-robin). Merged duplicate sign-ups:
--    #28 Gus B = #30 On Ont, #59=#60 Freddy/Souljah, #62=#63 Triple T's.
--    'Darrel Strawberry HC' and 'Harrex' are on the paper ladder but not the
--    sign-up sheet — kept with their recorded points (per your call).
insert into teams (name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
select v.* from (values
  ('On Ont',               'Gus B',        'Massimo P',         4, 'junior', 'Year 10',   'active', 5, 1, false),
  ('Eastlakes',            'Matheo D',      'Emre G',               2, 'junior', 'Year 10',   'active', 3, 1, false),
  ('T&C',                  'Tynan G',       'Cadel F',               5, 'junior', 'Year 9',    'active', 0, 0, false),
  ('MC',                   'Cassius S','Marlo S',             5, 'junior', 'Year 9',    'active', 0, 0, false),
  ('BH',                   'Bertie L',         'Harrison G',             3, 'junior', 'Year 9',    'active', 0, 0, false),
  ('Giggle n Hoot',        'Michello L',         'Zane R',            3, 'junior', 'Year 9',    'active', 0, 0, false),
  ('Remitherat',           'Louie H',    'Remi M',             3, 'junior', 'Year 9',    'active', 0, 0, false),
  ('Mohsen & Felix',       'Mohsen',              'Felix',                    3, 'junior', 'Year 8',    'active', 0, 0, false),
  ('Freddy & Souljah',     'Freddy A',       'Souljah T',           4, 'junior', 'Year 7',    'active', 5, 1, false),
  ('Triple T''s',          'Monty C',         'Shivraj S',           4, 'junior', 'Year 7',    'active', 0, 0, false),
  ('Lil Jits',             'Lucas L',           'Rai C',           3, 'junior', 'Year 7',    'active', 0, 0, false),
  ('The Handballers',      'Kaspar G',      'Joseph U',            4, 'junior', 'Year 7',    'active', 3, 1, false),
  ('BJ',                   'James B',       'Baxter A',         1, 'junior', 'Year 7',    'active', 0, 0, false),
  ('Darrel Strawberry HC', 'Georgio',             'Phoenix',                  3, 'junior', 'Year 7-10', 'active', 4, 1, false),
  ('Harrex',               'TBC',                 'TBC',                      3, 'junior', 'Year 10',   'active', 4, 1, false)
) as v(name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
where not exists (select 1 from teams t where t.name = v.name);

-- 5) New TEACHER teams (Demolition Men, The Ancients). Year 9 Mum & Dad handled above.
insert into teams (name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
select v.* from (values
  ('Demolition Men', 'Stewart O', 'Chris D', 5, 'senior', 'Teacher', 'active', 0, 0, true),
  ('The Ancients',   'Chris E', 'Nick S',  5, 'senior', 'Teacher', 'active', 0, 0, true)
) as v(name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
where not exists (select 1 from teams t where t.name = v.name);

-- 6) YEAR 11 teams (senior bracket, year_group 'Year 11'). Plays next term.
--    The four duplicate-player teams (Jethro, coolposeonthewall, Conrad F,
--    butter turtle) are added but left OUT of matches until you resolve them.
insert into teams (name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
select v.* from (values
  ('Stranger and danger',          'Finn B',     'Alpha G',            1, 'senior', 'Year 11', 'active', 0, 0, false),
  ('MO & JO',                      'Tyler J',   'Massimo V',            5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Hot shotz',                    'Iggy H',        'Finn N',            5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('4Square',                      'Leo C',   'Arvan W',             3, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Jethro',                       'Alek D',    'Jethro K',               4, 'senior', 'Year 11', 'active', 0, 0, false),
  ('pogfrogmorten',                'Alec B',       'Morten M', 5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('coolposeonthewall',            'Tristan T', 'Alek D',            5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Conrad F',                 'Tristan T',  'Conrad F',             2, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Sodabean',                     'Lewis C',     'Gabriel C', 4, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Pierced viper + crimson skull','Zola G',        'Ella O',   2, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Bounce bros',                  'Esteban C','Mac A',           3, 'senior', 'Year 11', 'active', 0, 0, false),
  ('butter turtle',                'Conrad F',     'Leo G',                 5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('carel l',                     'Carel L',         'Li C',                   5, 'senior', 'Year 11', 'active', 0, 0, false),
  ('Trouble Squared',              'Marlow C','Oliver S',             5, 'senior', 'Year 11', 'active', 0, 0, false)
) as v(name, player1, player2, skill_level, bracket, year_group, status, points, games_played, is_teacher)
where not exists (select 1 from teams t where t.name = v.name);

-- 7) Remove the leftover junior KNOCKOUT fixtures (juniors are round-robin now).
delete from matches where bracket = 'junior';

-- 8) YEAR 11 matches — next term, match_number 101/102 (won't collide with the
--    Year 12 round-1 fixtures 1-7). Grouped by skill within 1-2; the 2 leftover
--    clean teams (Pierced viper s2, Stranger and danger s1) are left unplaced.
insert into matches (bracket, round, match_number, scheduled_day, team1_id, team2_id, team3_id, team4_id,
                     team1_score, team2_score, team3_score, team4_score, status, is_skill_stretch, is_next_term)
select 'senior', 1, 101, 6,
  (select id from teams where name='MO & JO'),
  (select id from teams where name='Hot shotz'),
  (select id from teams where name='pogfrogmorten'),
  (select id from teams where name='carel l'),
  0,0,0,0, 'upcoming', false, true
where not exists (select 1 from matches where bracket='senior' and round=1 and match_number=101);

insert into matches (bracket, round, match_number, scheduled_day, team1_id, team2_id, team3_id, team4_id,
                     team1_score, team2_score, team3_score, team4_score, status, is_skill_stretch, is_next_term)
select 'senior', 1, 102, 6,
  (select id from teams where name='Trouble Squared'),
  (select id from teams where name='Sodabean'),
  (select id from teams where name='4Square'),
  (select id from teams where name='Bounce bros'),
  0,0,0,0, 'upcoming', false, true
where not exists (select 1 from matches where bracket='senior' and round=1 and match_number=102);

commit;

-- Sanity checks (run separately after committing):
-- select year_group, count(*) from teams group by year_group order by year_group;
-- select name, points, games_played from teams where bracket='junior' and not is_teacher order by points desc, games_played;
-- select name from teams where is_teacher;                       -- 3 teacher teams
-- select match_number, is_next_term from matches where is_next_term;  -- 2 Year 11 matches
