\set ON_ERROR_STOP on

begin;

do $$
declare
  test_user_id uuid;
  test_assignment_id uuid;
  test_task_count integer;
  original_updated_at timestamptz;
  changed_updated_at timestamptz;
begin
  insert into public.users (name, email, password)
  values ('Schema Test User', 'schema-test@example.com', 'test-password')
  returning id into test_user_id;

  insert into public.assignments (user_id, raw_text, title, due_date)
  values (
    test_user_id,
    'Read chapter 4 and submit reflection by Friday.',
    'Chapter 4 Reflection',
    now() + interval '7 days'
  )
  returning id, updated_at into test_assignment_id, original_updated_at;

  insert into public.tasks (assignment_id, description, priority, time_estimate, status)
  values
    (test_assignment_id, 'Read chapter 4', 1, 60, 'pending'),
    (test_assignment_id, 'Write reflection', 2, 90, 'pending');

  select count(*)
  into test_task_count
  from public.tasks
  where assignment_id = test_assignment_id;

  if test_task_count <> 2 then
    raise exception 'Expected 2 tasks for assignment %, found %', test_assignment_id, test_task_count;
  end if;

  perform pg_sleep(0.01);

  update public.assignments
  set title = 'Updated Chapter 4 Reflection'
  where id = test_assignment_id
  returning updated_at into changed_updated_at;

  if changed_updated_at <= original_updated_at then
    raise exception 'Expected assignments.updated_at to change on update';
  end if;

  delete from public.assignments
  where id = test_assignment_id;

  select count(*)
  into test_task_count
  from public.tasks
  where assignment_id = test_assignment_id;

  if test_task_count <> 0 then
    raise exception 'Expected cascade delete to remove tasks, found % remaining', test_task_count;
  end if;
end;
$$;

rollback;
