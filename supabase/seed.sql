-- WOSTEP Machine Register — seed data
-- Source: design_handoff_machine_register/data-collection/*.csv, as documented
-- in the handoff README's "Domain model" section. Run after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Rooms (data-collection/5 - Rooms.csv)
-- ---------------------------------------------------------------------------

insert into rooms (name_en, name_fr) values
  ('Micromechanics workshop', 'Atelier de micromécanique'),
  ('Heat treatment room', 'Salle de traitement thermique');

-- ---------------------------------------------------------------------------
-- People (data-collection/2 - People and email addresses.csv)
-- ---------------------------------------------------------------------------

insert into people (name, email, role, can_sign_in, receives_due_reminders, receives_fault_reports, receives_completed_emails, receives_overdue_emails) values
  ('Cédric Bassin', 'cedric.bassin@wostep.ch', 'director', true, true, true, true, true),
  ('Nicholas Wolfe', 'nicholas.wolfe@wostep.ch', 'instructor', true, true, true, false, false),
  ('Nelson Ventura', 'nelson.ventura@wostep.ch', 'instructor', true, true, true, false, false),
  ('Georgios Kalapotharakos', 'georgios.kalapotharakos@wostep.ch', 'instructor', true, true, true, false, false),
  ('Formation', 'formation@wostep.ch', 'instructor', true, true, true, true, true);

-- ---------------------------------------------------------------------------
-- Machines (data-collection/1 - Machines.csv)
-- next_due = last_service + interval_months, per the README's derivation rule
-- ---------------------------------------------------------------------------

insert into machines (asset_tag, name, manufacturer, room_id, serial, year, interval_months, last_service, next_due, photos_target, inv_ref)
select v.asset_tag, v.name, v.manufacturer, r.id, v.serial, v.year, v.interval_months,
       v.last_service,
       (v.last_service + (v.interval_months || ' months')::interval)::date,
       v.photos_target, v.inv_ref
from (values
  ('SCH-102-01', 'Schaublin 102', 'Schaublin', 'Micromechanics workshop', '170188', '1970', 36, date '2025-01-01', 7, 'Inv0043'),
  ('SCH-070-01', 'Schaublin 70', 'Schaublin', 'Micromechanics workshop', '352604', '2008', 36, date '2026-09-01', 7, 'Inv0047'),
  ('SCH-070-02', 'Schaublin 70', 'Schaublin', 'Micromechanics workshop', '350927', '2004', 36, date '2026-09-01', 7, 'Inv0037'),
  ('SCH-070-03', 'Schaublin 70', 'Schaublin', 'Micromechanics workshop', '342202', 'c.2002', 36, date '2026-09-01', 7, 'Inv0030'),
  ('FEL-P10-01', 'Feldmann P10', 'Feldmann', 'Micromechanics workshop', '10507124', '2007', 36, date '2026-09-01', 4, 'Inv0053'),
  ('HAU-M1-01', 'Hauser M1', 'Hauser', 'Micromechanics workshop', 'xxxx', 'c.1960', 36, date '2025-01-01', 4, 'Inv0022'),
  ('AGA-GR-01', 'Agathon Minor', 'Agathon', 'Micromechanics workshop', 'xxxx', 'c.1960', 36, date '2026-09-01', 1, 'Inv0057'),
  ('DRL-PR-01', 'Drill press', 'Golay-Buchel', 'Micromechanics workshop', '14815B', 'c.1955', 36, date '2026-09-01', null, 'Inv0060'),
  ('CDG-01', 'Manual decoration machine DS21', 'Schmid Machines', 'Micromechanics workshop', '182111', '2018', 36, date '2026-09-01', null, 'Inv0251'),
  ('PRL-PR-01', 'Pearlage press', null, 'Micromechanics workshop', 'xxxx', 'c.1960', 36, date '2026-09-01', null, 'Inv0252'),
  ('PRL-PR-02', 'Pearlage press', 'E. Bloesch', 'Micromechanics workshop', 'xxxx', 'c.1970', 36, date '2026-09-01', null, 'Inv0254'),
  ('VEC-08-01', '8mm lathe', 'Vector', 'Micromechanics workshop', 'xxxx', '2005', 36, date '2026-09-01', 1, 'Inv0061 & Inv0062 (accessories box)'),
  ('ISO-OM-01', 'Isoma M122', 'Isoma', 'Micromechanics workshop', '2200.172', 'c.1995', 36, date '2009-05-01', null, 'Inv0059'),
  ('ENG-MB-01', 'Engineers measuring block', 'Mytri', 'Micromechanics workshop', 'xxxx', '2023', 36, date '2026-09-01', null, null),
  ('GRS-HT-01', 'Power Hone', 'GRS', 'Heat treatment room', 'HE01070', '2002', 12, date '2026-09-01', 1, null),
  ('GRD-GR-01', 'Grinding machine', 'KEF - Slibette 6NE', 'Heat treatment room', '1026645', 'c.2000', 36, date '2026-09-01', null, null),
  ('HTO-OV-01', 'Heat treatment oven', 'Mario di Maio', 'Heat treatment room', '934', 'c.1970', 36, date '2026-09-01', null, 'Inv0081'),
  ('POL-PM-01', 'Polishing machine', 'Elma - Multispeed', 'Heat treatment room', '900148046 MSP', 'c.2010', 36, date '2026-09-01', null, 'Inv0079')
) as v(asset_tag, name, manufacturer, room_name, serial, year, interval_months, last_service, photos_target, inv_ref)
join rooms r on r.name_en = v.room_name;

-- ---------------------------------------------------------------------------
-- Service history — only the three machines genuinely overdue on the paper
-- sheet get a carried-forward entry (see README "Notes on this data"); the
-- rest of the register starts with no history, which is correct, not missing.
-- ---------------------------------------------------------------------------

insert into services (machine_id, date, work_type, signed_off_by_name, notes)
select m.id, m.last_service, 'carried_forward', 'Not recorded',
       'Carried forward from the paper inventory sheet.'
from machines m
where m.asset_tag in ('SCH-102-01', 'HAU-M1-01', 'ISO-OM-01');
