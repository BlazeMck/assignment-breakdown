require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Pool } = require("pg");

const defaultRawPostgresUrl = "http://localhost:54322";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const shouldUseSupabase =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== defaultRawPostgresUrl &&
  !supabaseUrl.startsWith(defaultRawPostgresUrl);

const hasPostgresConfig =
  Boolean(databaseUrl) ||
  Boolean(dbHost && dbPort && dbName && dbUser && dbPassword);

function createPostgresClient() {
  const poolConfig = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: dbHost,
        port: Number(dbPort),
        database: dbName,
        user: dbUser,
        password: dbPassword,
      };

  const pool = new Pool(poolConfig);

  class PgQueryBuilder {
    constructor(table) {
      this.table = table;
      this.pool = pool;
      this.action = null;
      this.columns = "*";
      this.payload = null;
      this.whereClauses = [];
      this.orderBy = null;
      this.singleMode = false;
    }

    select(columns = "*") {
      if (!this.action) {
        this.action = "select";
      }
      this.columns = columns || "*";
      return this;
    }

    insert(data) {
      this.action = "insert";
      this.payload = data;
      return this;
    }

    update(data) {
      this.action = "update";
      this.payload = data;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    eq(column, value) {
      this.whereClauses.push({ column, operator: "=", value });
      return this;
    }

    order(column, options = {}) {
      const ascending = options.ascending !== false;
      this.orderBy = `${column} ${ascending ? "ASC" : "DESC"}`;
      return this;
    }

    single() {
      this.singleMode = true;
      return this;
    }

    async execute() {
      const params = [];
      let sql;

      const whereClause = this.whereClauses
        .map(({ column, operator, value }, index) => {
          params.push(value);
          return `"${column}" ${operator} $${index + 1}`;
        })
        .join(" AND ");

      const whereSql = whereClause ? `WHERE ${whereClause}` : "";

      if (this.action === "select") {
        sql = `SELECT ${this.columns} FROM "${this.table}" ${whereSql}`;
        if (this.orderBy) {
          sql += ` ORDER BY ${this.orderBy}`;
        }
      } else if (this.action === "insert") {
        const rows = Array.isArray(this.payload)
          ? this.payload
          : [this.payload];
        if (rows.length === 0) {
          return { data: [], error: null };
        }

        const keys = Object.keys(rows[0]);
        const columns = keys.map((key) => `"${key}"`).join(", ");
        const valuesSql = rows
          .map((row, rowIndex) => {
            const rowKeys = Object.keys(row);
            const placeholderRow = rowKeys
              .map((key, keyIndex) => {
                params.push(row[key]);
                return `$${rowIndex * rowKeys.length + keyIndex + 1}`;
              })
              .join(", ");
            return `(${placeholderRow})`;
          })
          .join(", ");

        sql = `INSERT INTO "${this.table}" (${columns}) VALUES ${valuesSql} RETURNING ${this.columns}`;
      } else if (this.action === "update") {
        const keys = Object.keys(this.payload || {});
        const setClause = keys
          .map((key, idx) => {
            params.push(this.payload[key]);
            return `"${key}" = $${params.length}`;
          })
          .join(", ");

        sql = `UPDATE "${this.table}" SET ${setClause} ${whereSql} RETURNING ${this.columns}`;
      } else if (this.action === "delete") {
        sql = `DELETE FROM "${this.table}" ${whereSql} RETURNING ${this.columns}`;
      } else {
        throw new Error("Unsupported database action");
      }

      try {
        const result = await this.pool.query(sql.trim(), params);

        if (this.singleMode) {
          if (!result.rows || result.rows.length === 0) {
            return {
              data: null,
              error: {
                code: "PGRST116",
                message: "No rows found",
              },
            };
          }
          return { data: result.rows[0], error: null };
        }

        return { data: result.rows, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }
  }

  return {
    from: (table) => new PgQueryBuilder(table),
    query: (text, params) => pool.query(text, params),
    pool,
  };
}

let client;
if (shouldUseSupabase) {
  client = createClient(supabaseUrl, supabaseKey);
} else if (hasPostgresConfig) {
  client = createPostgresClient();
} else {
  throw new Error(
    "No database configuration found. Set SUPABASE_URL and SUPABASE_ANON_KEY for Supabase, or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD for raw Postgres.",
  );
}

module.exports = client;
