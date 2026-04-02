export class QueryBuilder {
  private whereClause: Record<string, unknown> = {};
  private orderByClause: Record<string, string> = {};
  private skipValue = 0;
  private takeValue = 10;

  where(conditions: Record<string, unknown>): this {
    this.whereClause = { ...this.whereClause, ...conditions };
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'desc'): this {
    this.orderByClause = { [field]: direction };
    return this;
  }

  paginate(page: number, limit: number): this {
    this.skipValue = (page - 1) * limit;
    this.takeValue = limit;
    return this;
  }

  build() {
    return {
      where: this.whereClause,
      orderBy: this.orderByClause,
      skip: this.skipValue,
      take: this.takeValue,
    };
  }
}
