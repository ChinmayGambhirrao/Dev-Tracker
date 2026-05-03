import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import problemRoutes from './src/routes/problemRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', problemRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Dev Productivity Tracker API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me'
            },
            problems: {
                add: 'POST /api/problems',
                list: 'GET /api/problems',
                stats: 'GET /api/stats',
                delete: 'DELETE /api/problems/:id'
            }
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n Server is running on http://localhost:${PORT}`);
    console.log(` API Documentation: http://localhost:${PORT}`);
    console.log(` Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});

export default app;