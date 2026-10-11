import "server-only";
import mysql from "mysql2/promise";

const pool =
  globalThis.mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.mysqlPool = pool;
}

export default pool;