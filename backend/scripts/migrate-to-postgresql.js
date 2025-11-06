const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

const SQLITE_DB = './prisma/dev.db';
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'erp_pdv',
  user: 'postgres',
  password: 'postgres'
};

async function migrateData() {
  console.log('Iniciando migração SQLite -> PostgreSQL...');
  
  const sqliteDb = new sqlite3.Database(SQLITE_DB);
  const pgClient = new Client(PG_CONFIG);
  
  await pgClient.connect();
  console.log('Conectado ao PostgreSQL!');
  
  const tables = [
    'User', 'Customer', 'Supplier', 'Product', 'Shift',
    'Sale', 'SaleItem', 'SalePayment', 'Purchase', 'PurchaseItem',
    'NFe', 'FiscalConfig', 'FinancialMovement', 'SaleReturn',
    'SaleReturnItem', 'Commission', 'Quotation', 'QuotationItem',
    'StockMovement', 'InventoryAlert'
  ];
  
  for (const table of tables) {
    await migrateTable(sqliteDb, pgClient, table);
  }
  
  await pgClient.end();
  sqliteDb.close();
  console.log('Migração concluída!');
}

function migrateTable(sqliteDb, pgClient, table) {
  return new Promise((resolve) => {
    console.log(`Migrando ${table}...`);
    
    sqliteDb.all(`SELECT * FROM ${table}`, [], async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        console.log(`${table}: 0 registros`);
        resolve();
        return;
      }
      
      for (const row of rows) {
        const columns = Object.keys(row).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(row);
        
        try {
          await pgClient.query(
            `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`,
            values
          );
        } catch (e) {
          console.error(`Erro em ${table}:`, e.message);
        }
      }
      
      console.log(`${table}: ${rows.length} registros migrados`);
      resolve();
    });
  });
}

migrateData().catch(console.error);
