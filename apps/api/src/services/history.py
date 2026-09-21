import asyncio
import json
import sqlite3
import time 
from pathlib import Path

DB_PATH       = Path(__file__).parent.parent.parent / "history.db"
SNAPSHOT_INTERVAL = 300   # 5 minutes
RETENTION_SECS    = 86400 # 24 hours


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _connect()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            ts        REAL    NOT NULL,
            layer     TEXT    NOT NULL,
            data      TEXT    NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_snapshots_ts_layer ON snapshots (ts, layer);
    """)
    conn.commit()
    conn.close()


def write_snapshot(layer: str, data: list):
    if not data:
        return
    ts   = time.time()
    conn = _connect()
    conn.execute(
        "INSERT INTO snapshots (ts, layer, data) VALUES (?, ?, ?)",
        (ts, layer, json.dumps(data)),
    )
    # Purge old rows for this layer
    conn.execute(
        "DELETE FROM snapshots WHERE layer = ? AND ts < ?",
        (layer, ts - RETENTION_SECS),
    )
    conn.commit()
    conn.close()


def read_nearest(layer: str, ts: float) -> list:
    """Return the snapshot for a layer closest to the requested timestamp."""
    conn = _connect()
    row  = conn.execute(
        """
        SELECT data FROM snapshots
        WHERE layer = ?
        ORDER BY ABS(ts - ?) ASC
        LIMIT 1
        """,
        (layer, ts),
    ).fetchone()
    conn.close()
    return json.loads(row["data"]) if row else []


def available_range() -> dict:
    """Return the earliest and latest timestamps in the archive."""
    conn = _connect()
    row  = conn.execute(
        "SELECT MIN(ts) as earliest, MAX(ts) as latest FROM snapshots"
    ).fetchone()
    conn.close()
    return {
        "earliest": row["earliest"] or time.time(),
        "latest":   row["latest"]   or time.time(),
    }


async def run_snapshot_loop(
    get_flights:     callable,
    get_earthquakes: callable,
    get_fires:       callable,
):
    """
    Background loop: every SNAPSHOT_INTERVAL seconds, pull cached data
    from the live routes and write a snapshot to SQLite.
    """
    init_db()
    print(f"History: archive started - snapshotting every {SNAPSHOT_INTERVAL}s, retaining {RETENTION_SECS // 3600}h")

    while True:
        await asyncio.sleep(SNAPSHOT_INTERVAL)
        try:
            write_snapshot("flights",     get_flights())
            write_snapshot("earthquakes", get_earthquakes())
            write_snapshot("fires",       get_fires())
        except Exception as e:
            print(f"History: snapshot failed: {e}")