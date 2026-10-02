-- "Caddie incluido" no aportaba información útil: se reemplaza por "caddie
-- compartido" (el caddie se comparte entre anfitrión e invitado y el costo
-- se divide entre 2). Solo renombra la columna; los valores existentes se
-- conservan. Segura de correr más de una vez.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tee_time_offers' and column_name = 'caddie_incluido'
  ) then
    alter table public.tee_time_offers rename column caddie_incluido to caddie_compartido;
  end if;
end $$;
