begin;

-- Remove any existing seed data for the same seed user to make the script repeatable.
delete from public.tasks
where assignment_id in (
  select id
  from public.assignments
  where title = 'Chapter 4 Reflection'
    and user_id = (select id from public.users where email = 'seed@example.com')
);

delete from public.assignments
where title = 'Chapter 4 Reflection'
  and user_id = (select id from public.users where email = 'seed@example.com');

delete from public.users
where email = 'seed@example.com';

with inserted_user as (
  insert into public.users (name, email, password)
  values ('Seed User', 'seed@example.com', 'seed-password')
  returning id
), inserted_assignment as (
  insert into public.assignments (user_id, raw_text, title, due_date)
  select id, 'Read chapter 4 and submit reflection by Friday.', 'Chapter 4 Reflection', now() + interval '7 days'
  from inserted_user
  returning id
)
insert into public.tasks (assignment_id, description, priority, time_estimate, status)
select id, 'Read chapter 4', 1, 60, 'pending'
from inserted_assignment
union all
select id, 'Write reflection', 2, 90, 'pending'
from inserted_assignment;

commit;
