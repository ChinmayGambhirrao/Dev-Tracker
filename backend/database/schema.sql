-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- DSA Problems table (FIXED)
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    pattern VARCHAR(50),
    source VARCHAR(50),
    time_taken_mins INTEGER,
    status VARCHAR(20) DEFAULT 'solved' CHECK (status IN ('solved', 'attempted', 'reviewing')),
    notes TEXT,
    problem_url TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- ← Added comma
    leetcode_number INTEGER  -- ← Removed comma
);

-- Daily activity table (FIXED)
CREATE TABLE daily_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    problems_solved INTEGER DEFAULT 0,  -- ← Added back the column
    UNIQUE(user_id, date)
);

-- Weekly goals
CREATE TABLE weekly_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    target_problems INTEGER DEFAULT 5,
    reflection TEXT,
    UNIQUE(user_id, week_start_date)
);

-- Tags for problems
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Problem-Tags junction table
CREATE TABLE problem_tags (
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, tag_id)
);

-- User preferences
CREATE TABLE user_settings (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    weekly_target INTEGER DEFAULT 5,
    daily_reminder_time TIME,
    theme VARCHAR(20) DEFAULT 'light',
    notification_enabled BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_problems_logged_at ON problems(logged_at);  -- Fixed: changed from solved_at
CREATE INDEX idx_problems_user_status ON problems(user_id, status);
CREATE INDEX idx_daily_activity_user_id ON daily_activity(user_id);
CREATE INDEX idx_daily_activity_date ON daily_activity(date);
CREATE INDEX idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);