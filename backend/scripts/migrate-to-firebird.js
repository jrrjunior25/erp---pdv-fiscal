const sqlite3 = require('sqlite3').verbose();
const Firebird = require('node-firebird');

const SQLITE_DB = './prisma/dev.db';
const FIREBIRD_CONFIG = {
  host: 'localhost',
  port: 3050,
  database: 'C:/dados/erp.fdb',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

async function migrateData() {
  console.log('Iniciando migração SQLite -> Firebird...');
  
  const sqliteDb = new sqlite3.Database(SQLITE_DB);
  
  Firebird.attach(FIREBIRD_CONFIG, (err, db) => {
    if (err) {
      console.error('Erro ao conectar no Firebird:', err);
      return;
    }
    
    console.log('Conectado ao Firebird com sucesso!');
    
    // Migrar tabelas na ordem correta (respeitando foreign keys)
    const tables = [
      'User', 'Customer', 'Supplier', 'Product', 'Shift',
      'Sale', 'SaleItem', 'SalePayment', 'Purchase', 'PurchaseItem',
      'NFe', 'FiscalConfig', 'FinancialMovement', 'SaleReturn',
      'SaleReturnItem', 'Commission', 'Quotation', 'QuotationItem',
      'StockMovement', 'InventoryAlert'
    ];
    
    migrateTable(sqliteDb, db, tables, 0, () => {
      db.detach();
      sqliteDb.close();
      console.log('Migração concluída!');
    });
  });
}

function migrateTable(sqliteDb, firebirdDb, tables, index, callback) {
  if (index >= tables.length) {
    callback();
    return;
  }
  
  const table = tables[index];
  console.log(`Migrando tabela ${table}...`);
  
  sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
    if (err) {
      console.error(`Erro ao ler ${table}:`, err);
      migrateTable(sqliteDb, firebirdDb, tables, index + 1, callback);
      return;
    }
    
    if (rows.length === 0) {
      console.log(`${table}: 0 registros`);
      migrateTable(sqliteDb, firebirdDb, tables, index + 1, callback);
      return;
    }
    
    insertRows(firebirdDb, table, rows, 0, () => {
      console.log(`${table}: ${rows.length} registros migrados`);
      migrateTable(sqliteDb, firebirdDb, tables, index + 1, callback);
    });
  });
}

function insertRows(db, table, rows, index, callback) {
  if (index >= rows.length) {
    callback();
    return;
  }
  
  const row = rows[index];
  const columns = Object.keys(row).join(', ');
  const placeholders = Object.keys(row).map(() => '?').join(', ');
  const values = Object.values(row);
  
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  
  db.query(sql, values, (err) => {
    if (err) {
      console.error(`Erro ao inserir em ${table}:`, err);
    }
    insertRows(db, table, rows, index + 1, callback);
  });
}

migrateData();
