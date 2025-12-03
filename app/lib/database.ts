import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "clinic_user",
  password: process.env.DB_PASSWORD || "clinic_password",
  database: process.env.DB_NAME || "clinic_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timeout: 60000, // 60 segundos timeout
  acquireTimeout: 60000,
};

let pool: mysql.Pool;

export const getConnection = async (): Promise<mysql.PoolConnection> => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return await pool.getConnection();
};

export const query = async (sql: string, params: any[] = []) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
};

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Helper para ejecutar queries de forma segura con manejo automático de conexiones
export const executeQuery = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T> => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results as T;
  } finally {
    connection.release();
  }
};
