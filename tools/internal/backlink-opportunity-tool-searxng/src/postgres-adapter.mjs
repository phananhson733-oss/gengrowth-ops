function requireSql(sql) {
  if (!sql || typeof sql.unsafe !== 'function') {
    throw new Error('A postgres.js client is required');
  }
  return sql;
}

export function createPostgresDatabase({ sql }) {
  const client = requireSql(sql);

  return {
    async upsertOpportunity(record) {
      const rows = await client.unsafe(`
        insert into opportunities (canonical_url, payload)
        values ($1, $2::jsonb)
        on conflict (canonical_url) do update
          set payload = excluded.payload, last_checked_at = now()
        returning id, (xmax = 0) as created
      `, [record.referring_page_url, JSON.stringify(record)]);
      return { id: rows[0].id, created: Boolean(rows[0].created) };
    },

    async upsertSource(opportunityId, source) {
      await client.unsafe(`
        insert into opportunity_sources (opportunity_id, mode, input, payload)
        values ($1, $2, $3, $4::jsonb)
        on conflict (opportunity_id, mode, input) do update
          set payload = excluded.payload
      `, [opportunityId, source.mode, source.input, JSON.stringify(source)]);
    },

    async createJob({ mode, input, language, region, requestedLimit }) {
      const rows = await client.unsafe(`
        insert into discovery_jobs (mode, input, language, region, requested_limit, status)
        values ($1, $2, $3, $4, $5, 'queued')
        returning id, status
      `, [mode, input, language, region, requestedLimit]);
      return rows[0];
    },

    async listOpportunities({ view }) {
      const mode = view === 'competitor' ? 'competitor_search' : 'keyword';
      const rows = await client.unsafe(`
        select o.payload
        from opportunities o
        where exists (
          select 1 from opportunity_sources s
          where s.opportunity_id = o.id and s.mode = $1
        )
        order by o.created_at desc
      `, [mode]);
      return rows.map((row) => row.payload);
    },

    async getJob(jobId) {
      const rows = await client.unsafe(`
        select id, mode, input, language, region, requested_limit as "requestedLimit", status, summary, error, created_at as "createdAt", started_at as "startedAt", completed_at as "completedAt"
        from discovery_jobs where id = $1
      `, [jobId]);
      return rows[0] ?? null;
    },

    async completeJob(jobId, summary) {
      await client.unsafe(`
        update discovery_jobs
        set status = 'completed', summary = $2::jsonb, completed_at = now(), error = null
        where id = $1
      `, [jobId, JSON.stringify(summary)]);
    },
  };
}
