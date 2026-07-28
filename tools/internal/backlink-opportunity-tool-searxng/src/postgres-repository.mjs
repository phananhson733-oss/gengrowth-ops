function requireDatabase(database) {
  if (!database || typeof database.upsertOpportunity !== 'function' || typeof database.upsertSource !== 'function') {
    throw new Error('A PostgreSQL database adapter is required');
  }
  return database;
}

export class PostgresRepository {
  constructor({ database }) {
    this.database = requireDatabase(database);
  }

  async upsertOpportunities(records = []) {
    let created = 0;
    let updated = 0;

    for (const record of records) {
      const opportunity = await this.database.upsertOpportunity(record);
      if (opportunity.created) created += 1;
      else updated += 1;

      for (const source of record.sources ?? []) {
        await this.database.upsertSource(opportunity.id, source);
      }
    }

    return { created, updated };
  }

  async listOpportunities({ view }) {
    if (!['keyword', 'competitor'].includes(view)) {
      throw new Error('view must be keyword or competitor');
    }
    return this.database.listOpportunities({ view });
  }

  async createJob(input) {
    return this.database.createJob(input);
  }

  async getJob(jobId) {
    return this.database.getJob(jobId);
  }

  async completeJob(jobId, summary) {
    return this.database.completeJob(jobId, summary);
  }
}
