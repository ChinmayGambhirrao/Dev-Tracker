import {Pool} from 'pg';
import dotenv from 'dotenv';
import { release } from 'node:os';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Test connection
pool.connect((err, client, release) => {
    if(err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

export default pool;

