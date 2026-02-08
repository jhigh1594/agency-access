-- Schema for events.db - Passive event capture for memory system Phase 1
-- All events have automatic 7-day TTL via trigger cleanup

-- Core events table with automatic TTL cleanup
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_data TEXT NOT NULL,  -- JSON string of event-specific data
    session_id TEXT,
    metadata TEXT  -- Optional JSON metadata
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Command usage tracking
CREATE TABLE IF NOT EXISTS command_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    command_name TEXT NOT NULL,
    command_context TEXT,  -- e.g., flags, args
    execution_duration_ms INTEGER,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_command_usage_name ON command_usage(command_name);

-- File cluster tracking
CREATE TABLE IF NOT EXISTS file_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT,  -- For detecting content changes
    operation_type TEXT NOT NULL,  -- 'read', 'write', 'edit'
    cluster_id TEXT,  -- Groups files edited together
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_clusters_path ON file_clusters(file_path);
CREATE INDEX IF NOT EXISTS idx_file_clusters_cluster ON file_clusters(cluster_id);

-- Time pattern tracking
CREATE TABLE IF NOT EXISTS time_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,  -- 'session_start', 'session_end', 'active_work', 'idle'
    duration_seconds INTEGER,
    time_of_day_hour INTEGER,
    day_of_week INTEGER,  -- 0=Monday, 6=Sunday
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_patterns_type ON time_patterns(activity_type);

-- Success signal tracking
CREATE TABLE IF NOT EXISTS success_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    signal_type TEXT NOT NULL,  -- 'git_commit', 'task_complete', 'pr_merge'
    signal_strength REAL,  -- 0.0 to 1.0 confidence/importance score
    context_data TEXT,  -- Additional context (commit msg, task description, etc.)
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_success_signals_type ON success_signals(signal_type);

-- Automatic TTL cleanup trigger (7 days)
-- Fires after every INSERT to delete events older than 7 days
CREATE TRIGGER IF NOT EXISTS cleanup_old_events
AFTER INSERT ON events
BEGIN
    DELETE FROM events WHERE event_timestamp < datetime('now', '-7 days');
END;
