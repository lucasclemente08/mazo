-- Run after schema.sql in the dedicated MAZO project.
create extension if not exists pg_cron;
select cron.schedule('mazo-cleanup', '*/5 * * * *', $$
 select public.mazo_cleanup();
 -- This project is dedicated to MAZO: remove unused temporary identities too.
 delete from auth.users u where u.is_anonymous is true
  and u.created_at < now() - interval '1 hour'
  and not exists (select 1 from public.players p where p.auth_user_id = u.id);
 -- Do not accumulate this job's execution history.
 delete from cron.job_run_details where jobid =
  (select jobid from cron.job where jobname = 'mazo-cleanup')
  and end_time < now() - interval '1 day';
$$);
