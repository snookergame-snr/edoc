import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://postgres:P@ssw0rd@191.1.9.101:5432/hospital_docs',
    ssl: false, // <-- ตรงนี้ ใส่ ssl: false ไปเลย
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
