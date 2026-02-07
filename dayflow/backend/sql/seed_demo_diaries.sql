-- ============================================================
-- DayFlow: Demo Diary Data for Test Users
-- Run AFTER setup_users.sql in Supabase SQL Editor
-- ============================================================

-- Helper: get user IDs by email
do $$
declare
  alice_id uuid;
  bob_id   uuid;
  charlie_id uuid;
  d_id uuid;
begin

select id into alice_id from auth.users where email = 'alice@test.com';
select id into bob_id from auth.users where email = 'bob@test.com';
select id into charlie_id from auth.users where email = 'charlie@test.com';

-- ════════════════════════════════════════════════════════════
-- ALICE — 3 days of diaries
-- ════════════════════════════════════════════════════════════

-- Alice: Feb 5
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-05', alice_id,
  'Started the morning with a warm latte at Blue Bottle. The foam art was beautiful today. Had a productive study session at the library — finally finished my ML assignment. Grabbed ramen with Sarah for lunch, we talked about summer internships. Spent the afternoon coding at the hackathon prep meeting. Ended the day with a sunset walk along the Cut.',
  'Morning latte, ML homework, ramen with Sarah...',
  'Spent $28.50 today — mostly on food. Coffee habit adds up!',
  'Pack lunch tomorrow to save on food expenses.',
  29, '☕')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '08:30', '☕', 'Morning coffee at Blue Bottle', 'Latte with beautiful foam art', 6.5, 'Blue Bottle Coffee', 'calendar', false),
  (d_id, '10:00', '📚', 'Study session at library', 'Finished ML assignment', 0, 'Hunt Library', 'calendar', false),
  (d_id, '12:30', '🍜', 'Lunch with Sarah', 'Ramen and internship chat', 14, 'Noodle Bar', 'calendar', false),
  (d_id, '14:00', '💻', 'Hackathon prep meeting', 'Coded prototype with team', 0, 'Gates Center', 'calendar', false),
  (d_id, '17:30', '🌅', 'Sunset walk', 'Beautiful sunset along the Cut', 0, 'The Cut', 'manual', false),
  (d_id, '19:00', '🍕', 'Dinner — leftover pizza', 'Quick dinner at home', 8.5, 'Home', 'manual', false);

-- Alice: Feb 6
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-06', alice_id,
  'TartanHack day! Woke up early and grabbed a bagel on the way. Spent the entire day at the hackathon building DayFlow with the team. We got the calendar integration working which felt amazing. Had pizza for dinner (free hackathon food!). Late night coding session until 2am.',
  'TartanHack all day! Built DayFlow...',
  'Only spent $4.50 today thanks to free hackathon food!',
  'Remember to sleep — hackathons are fun but rest matters.',
  5, '🚀')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '07:00', '🥯', 'Bagel on the way', 'Quick breakfast before hackathon', 4.5, 'Brueggers Bagels', 'manual', false),
  (d_id, '09:00', '🚀', 'TartanHack kickoff', 'Opening ceremony and team formation', 0, 'Cohon Center', 'calendar', false),
  (d_id, '11:00', '💻', 'Frontend development', 'Built the diary input flow UI', 0, 'Cohon Center', 'calendar', false),
  (d_id, '13:00', '🍕', 'Hackathon lunch', 'Free pizza from sponsors', 0, 'Cohon Center', 'calendar', false),
  (d_id, '15:00', '📅', 'Calendar integration', 'Got Google Calendar API working!', 0, 'Cohon Center', 'calendar', false),
  (d_id, '18:00', '🍔', 'Hackathon dinner', 'Free burgers', 0, 'Cohon Center', 'calendar', false),
  (d_id, '20:00', '🤖', 'AI diary generation', 'Integrated Dedalus for diary writing', 0, 'Cohon Center', 'calendar', false);

-- Alice: Feb 7
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-07', alice_id,
  'Final day of TartanHack. Polished the demo and submitted at noon. Our DayFlow project got great feedback from judges! Celebrated with bubble tea after. Took the rest of the afternoon to rest. Called mom in the evening — she was happy to hear about the hackathon.',
  'TartanHack submission day! Great feedback...',
  'Spent $12 — bubble tea celebration was worth it.',
  'Take it easy this weekend, you earned it.',
  12, '🏆')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '08:00', '💻', 'Final polish', 'Bug fixes and demo prep', 0, 'Cohon Center', 'calendar', false),
  (d_id, '12:00', '🏆', 'Project submission', 'Submitted DayFlow to judges', 0, 'Cohon Center', 'calendar', false),
  (d_id, '13:30', '🧋', 'Bubble tea celebration', 'Celebrated with the team', 7, 'Kung Fu Tea', 'manual', false),
  (d_id, '15:00', '😴', 'Rest at home', 'Much needed nap after hackathon', 0, 'Home', 'manual', false),
  (d_id, '18:00', '🍝', 'Pasta dinner', 'Cooked pasta at home', 5, 'Home', 'manual', false),
  (d_id, '20:00', '📞', 'Called mom', 'Told her about the hackathon', 0, 'Home', 'manual', false);

-- ════════════════════════════════════════════════════════════
-- BOB — 2 days of diaries
-- ════════════════════════════════════════════════════════════

-- Bob: Feb 5
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-05', bob_id,
  'Had a chill day today. Morning gym session felt great — hit a new PR on bench press. Grabbed a smoothie after. Attended the algorithms lecture which was actually interesting for once. Met up with the study group to work on the group project. Cooked bibimbap for dinner.',
  'Gym PR, algorithms class, bibimbap dinner...',
  'Spent $15 — gym smoothie was pricey but needed the protein.',
  'Start working on the OS project — deadline is next week.',
  15, '🏋️')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '07:00', '🏋️', 'Morning gym — PR day!', 'New bench press personal record', 0, 'UC Gym', 'calendar', false),
  (d_id, '08:30', '🥤', 'Post-workout smoothie', 'Protein smoothie', 8, 'Smoothie King', 'manual', false),
  (d_id, '10:00', '📝', 'Algorithms lecture', 'Dynamic programming — actually interesting', 0, 'DH 2210', 'calendar', false),
  (d_id, '13:00', '🥗', 'Lunch at Schatz', 'Salad and sandwich combo', 7, 'Schatz Dining', 'calendar', false),
  (d_id, '15:00', '👥', 'Group project meeting', 'Worked on system design doc', 0, 'Sorrells Library', 'calendar', false),
  (d_id, '19:00', '🍚', 'Cooked bibimbap', 'Made it from scratch — turned out great', 0, 'Home', 'manual', false);

-- Bob: Feb 6
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-06', bob_id,
  'Woke up late, skipped the morning class (oops). Spent most of the day at TartanHack helping friends with their project. The energy there was amazing. Had free food all day which was nice. Evening basketball game with the boys — we won! Watched a movie before bed.',
  'TartanHack vibes, basketball win, movie night...',
  'Zero spending today! Free hackathon food for the win.',
  'Dont skip class again — check lecture notes online.',
  0, '🏀')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '10:30', '😴', 'Woke up late', 'Skipped morning class...', 0, 'Home', 'manual', false),
  (d_id, '12:00', '🚀', 'TartanHack visit', 'Helped friends with their project', 0, 'Cohon Center', 'calendar', false),
  (d_id, '13:00', '🌮', 'Free hackathon tacos', 'Sponsor-provided lunch', 0, 'Cohon Center', 'calendar', false),
  (d_id, '16:00', '🏀', 'Basketball with friends', 'Won the pickup game!', 0, 'UC Courts', 'manual', false),
  (d_id, '18:30', '🍕', 'Free hackathon pizza (again)', 'Went back for dinner', 0, 'Cohon Center', 'manual', false),
  (d_id, '21:00', '🎬', 'Movie night', 'Watched Interstellar — still amazing', 0, 'Home', 'manual', false);

-- ════════════════════════════════════════════════════════════
-- CHARLIE — 2 days of diaries
-- ════════════════════════════════════════════════════════════

-- Charlie: Feb 6
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-06', charlie_id,
  'Beautiful day for photography! Took my camera out in the morning to shoot the frost on campus. The light was perfect around 8am. Had a productive design review for the capstone project. Tried the new Thai place on Craig Street for lunch — the pad thai was incredible. Spent the evening editing photos in Lightroom.',
  'Morning photography, design review, Thai food...',
  'Spent $22 — the new Thai place was worth it though.',
  'Submit the edited photos to the campus magazine by Friday.',
  22, '📸')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '07:30', '📸', 'Morning photography', 'Frost on campus — beautiful light', 0, 'CMU Campus', 'manual', false),
  (d_id, '10:00', '🎨', 'Capstone design review', 'Got good feedback on UI mockups', 0, 'CFA 214', 'calendar', false),
  (d_id, '12:30', '🍜', 'Thai lunch on Craig St', 'New place — amazing pad thai', 16, 'Thai Gourmet', 'manual', false),
  (d_id, '14:00', '📐', 'UX research session', 'User interviews for capstone', 0, 'HCII Lab', 'calendar', false),
  (d_id, '16:00', '☕', 'Coffee break', 'Flat white at Commonplace', 6, 'Commonplace Coffee', 'manual', false),
  (d_id, '19:00', '🖥️', 'Photo editing session', 'Edited morning shots in Lightroom', 0, 'Home', 'manual', false);

-- Charlie: Feb 7
insert into diaries (id, date, user_id, diary_text, diary_preview, spending_insight, tomorrow_suggestion, total_spending, primary_emoji)
values (gen_random_uuid(), '2026-02-07', charlie_id,
  'Lazy Saturday morning — slept in and made pancakes. Went to the CMU art gallery with friends in the afternoon. The new exhibition on generative art was mind-blowing. Stopped by the bookstore and picked up a typography book. Cooked dinner at home and worked on personal website redesign.',
  'Pancakes, art gallery, typography book...',
  'Spent $35 — the typography book was an impulse buy but no regrets.',
  'Start reading the typography book this weekend.',
  35, '🎨')
returning id into d_id;

insert into timeline_events (diary_id, time, emoji, title, description, spending, location, source, is_deleted) values
  (d_id, '10:00', '🥞', 'Pancake breakfast', 'Made blueberry pancakes from scratch', 0, 'Home', 'manual', false),
  (d_id, '13:00', '🎨', 'CMU Art Gallery', 'Generative art exhibition — amazing', 0, 'CMU Art Gallery', 'calendar', false),
  (d_id, '15:00', '📖', 'Bookstore visit', 'Bought a typography book', 28, 'CMU Bookstore', 'manual', false),
  (d_id, '16:30', '☕', 'Coffee & reading', 'Started the new book at a cafe', 7, 'De Fer Coffee', 'manual', false),
  (d_id, '18:30', '🍳', 'Cooked dinner', 'Stir-fry with veggies', 0, 'Home', 'manual', false),
  (d_id, '20:00', '💻', 'Website redesign', 'Worked on personal portfolio', 0, 'Home', 'manual', false);

raise notice 'Demo data seeded: Alice (3 days), Bob (2 days), Charlie (2 days)';
end $$;
