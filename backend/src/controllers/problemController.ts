import { type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import pool from "../db/index.js";

export const addProblem = async (req: AuthRequest, res: Response) => {
    const {
        title,
        difficulty,
        pattern,
        source,
        time_taken_mins,
        status = 'solved',
        notes,
        problem_url,
        leetcode_number
    } = req.body;

    const userId = req.userId;

    // Validation
    if(!title || !difficulty) {
        return res.status(400).json({error: 'Title and difficulty are required'});
    }

    try {
        // Start transaction
        await pool.query('BEGIN');

        // Add the problem
        const result = await pool.query(
            `INSERT INTO problems
            (user_id, title, difficulty, pattern, source, time_taken_mins, status, notes, problem_url, leetcode_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [userId, title, difficulty, pattern, source, time_taken_mins, status, notes, problem_url, leetcode_number]
        );

        const newProblem = result.rows[0];

        // Update daily activity if problem is solved
        if(status === 'solved') {
            const today = new Date().toISOString().split('T')[0];

            await pool.query(
                `INSERT INTO daily_activity (user_id, date, problems_solved) VALUES ($1, $2, 1)
                ON CONFLICT (user_id, date)
                DO UPDATE SET problems_solved = daily_activity.problems_solved + 1`,
                [userId, today]
            )
        }

        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Problem added successfully',
            problem: newProblem
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Add problem error:', error);
        res.status(500).json({error: 'Failed to add problem'});
    }
}

export const getProblems = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const {limit = 50, offset = 0, status, difficulty} = req.query;

    try {
        let query = `SELECT * FROM problems WHERE user_id = $1`;
        const params: any[] = [userId];
        let paramIndex = 2;

        if(status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY logged_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM problems WHERE user_id = $1`,
            [userId]
        )

        res.json({
            problems: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        })
    } catch (error) {
        console.error('Get problems error:', error);
        res.status(500).json({error: 'Failed to fetch problems'});
    }
}

export const getStats = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        // Total problems solved
        const totalResult = await pool.query(
            `SELECT COUNT(*) as total FROM problems WHERE user_id = $1 AND status = 'solved'`,
            [userId]
        )

        // Problems by difficulty
        const difficultyResult = await pool.query(
            `SELECT difficulty, COUNT(*) as count
            FROM problems
            WHERE user_id = $1 AND status = 'solved'
            GROUP BY difficulty`,
            [userId]
        )

        // Current streak
        const streakResult = await pool.query(
            `WITH RECURSIVE streak_calc AS (
               SELECT date, 1 as streak
               FROM daily_activity
               WHERE user_id = $1 AND date = CURRENT_DATE AND problems_solved > 0

               UNION ALL

               SELECT da.date, sc.streak + 1
               FROM daily_activity da
               JOIN streak_calc sc ON da.date = sc.date - INTERVAL '1 day'
               WHERE da.user_id = $1 AND da.problems_solved > 0
            ) 
               SELECT MAX(streak) as current_streak FROM sreak_calc`,
               [userId]
        )

        // Longest streak
        const longestStreakResult = await pool.query(
            `WITH streak_groups AS(
                SELECT
                    date,
                    problems_solved,
                    date - (ROW_NUMBER() OVER (ORDER BY date))::int * INTERVAL '1 day' as grp FROM daily_activity WHERE user_id = $1 AND problems_solved > 0
            )
                    SELECT MAX(streak_length) as longest_streak FROM(
                      SELECT COUNT(*) as streak_length
                      FROM streak_groups
                      GROUP BY grp
                    ) streaks`,
                     [userId]
        )

        // This week's progress
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1));
        const weekStartStr = startOfWeek.toISOString().split('T')[0];

        const weekProgressResult = await pool.query(
            `SELECT COALESCE(SUM(problems_solved), 0) as total FROM daily_activity WHERE user_id = $1 aND date >= $2`,
            [userId, weekStartStr]
        )

        // Recent activity (last 7 days)
        const recentActivityResult = await pool.query(
            `SELECT date, problems_solved
            FROM daily_activity
            WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date DESC`,
            [userId]
        )

        // Prepare difficulty data
        const difficultyMap: Record<string, number> = {
            Easy: 0,
            Medium: 0,
            Hard: 0
        }
        difficultyResult.rows.forEach(row => {
            difficultyMap[row.difficulty] = parseInt(row.count);
        })

        res.json({
            totalSolved: parseInt(totalResult.rows[0].total),
            byDifficulty: difficultyMap,
            currentStreak: streakResult.rows[0]?.current_streak || 0,
            longestStreak: longestStreakResult.rows[0]?.longest_streak || 0,
            thisWeek: parseInt(weekProgressResult.rows[0].total),
            recentActivity: recentActivityResult.rows
        })
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({error: 'Failed to fetch stats'});
    }
}

export const deleteProblem = async (req: AuthRequest, res: Response) => {
    const problemId = req.params.id;
    const userId = req.userId;

    try {
        const result = await pool.query(
            'DELETE FROM problems WHERE id = $1 AND user_id = $2 RETURNING id',
            [problemId, userId]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({error: 'Problem not found'})
        }

        res.json({message: 'Problem deleted successfully'})
    } catch (error) {
        console.error('Delete problem error:', error);
        res.status(500).json({error: 'Failed to delete problem'})
    }
}