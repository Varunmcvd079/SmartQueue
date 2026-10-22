from datetime import datetime, timedelta
import pandas as pd
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .models import Token, Counter, Service, QueueLog

def generate_analytics_summary(db: Session) -> Dict[str, Any]:
    """
    Computes statistical and business intelligence summaries using Pandas.
    Analyzes queue wait times, counter efficiency, service bottlenecks, and hourly throughput.
    """
    tokens = db.query(Token).all()
    counters = db.query(Counter).all()
    services = db.query(Service).all()
    logs = db.query(QueueLog).all()

    services_map = {s.id: s.name for s in services}
    counters_map = {c.id: f"Counter {c.counter_number:02d}" for c in counters}

    if not tokens:
        return {
            "total_tokens": 0,
            "waiting_count": 0,
            "called_count": 0,
            "served_count": 0,
            "avg_wait_mins": 0.0,
            "priority_breakdown": {},
            "service_bottlenecks": [],
            "counter_efficiency": [],
            "throughput_hourly": [],
            "health_score": 100
        }

    # Convert tokens to Pandas DataFrame
    records = []
    for t in tokens:
        # Calculate actual or estimated wait time
        wait_val = t.estimated_wait_mins or 0.0
        actual_wait = 0.0
        if t.called_at and t.created_at:
            actual_wait = (t.called_at - t.created_at).total_seconds() / 60.0
        elif t.status == "WAITING" and t.created_at:
            actual_wait = (datetime.utcnow() - t.created_at).total_seconds() / 60.0

        records.append({
            "id": t.id,
            "token_number": t.token_number,
            "service_id": t.service_id,
            "service_name": services_map.get(t.service_id, "Unknown"),
            "customer_name": t.customer_name,
            "priority_level": t.priority_level,
            "status": t.status,
            "estimated_wait_mins": round(t.estimated_wait_mins or 0.0, 1),
            "actual_wait_mins": round(actual_wait, 1),
            "created_at": t.created_at,
            "called_at": t.called_at,
            "served_at": t.served_at,
            "counter_id": t.counter_id
        })

    df = pd.DataFrame(records)

    total_tokens = len(df)
    status_counts = df["status"].value_counts().to_dict()
    waiting_count = status_counts.get("WAITING", 0)
    called_count = status_counts.get("CALLED", 0)
    served_count = status_counts.get("SERVED", 0)
    skipped_count = status_counts.get("SKIPPED", 0)

    # Average wait time
    avg_wait = round(float(df["actual_wait_mins"].mean()), 1) if not df.empty else 0.0

    # Priority breakdown
    priority_group = df.groupby("priority_level").agg(
        count=("id", "count"),
        avg_wait=("actual_wait_mins", "mean")
    ).reset_index()

    priority_breakdown = {}
    for _, row in priority_group.iterrows():
        priority_breakdown[row["priority_level"]] = {
            "count": int(row["count"]),
            "avg_wait_mins": round(float(row["avg_wait"]), 1)
        }

    # Service bottlenecks
    service_group = df.groupby(["service_id", "service_name"]).agg(
        total_queued=("id", "count"),
        waiting=("status", lambda s: (s == "WAITING").sum()),
        served=("status", lambda s: (s == "SERVED").sum()),
        avg_wait=("actual_wait_mins", "mean")
    ).reset_index()

    service_bottlenecks = []
    for _, row in service_group.iterrows():
        # Density index calculation: high waiting ratio creates bottleneck
        waiting_val = int(row["waiting"])
        density_index = "CRITICAL" if waiting_val >= 8 else ("MODERATE" if waiting_val >= 4 else "OPTIMAL")
        service_bottlenecks.append({
            "service_id": int(row["service_id"]),
            "service_name": row["service_name"],
            "total_tokens": int(row["total_queued"]),
            "waiting": waiting_val,
            "served": int(row["served"]),
            "avg_wait_mins": round(float(row["avg_wait"]), 1),
            "status": density_index
        })

    # Counter efficiency
    counter_records = []
    for c in counters:
        counter_tokens = df[df["counter_id"] == c.id]
        served_num = (counter_tokens["status"] == "SERVED").sum()
        current_active = counter_tokens[counter_tokens["status"] == "CALLED"]
        active_tok_str = current_active["token_number"].iloc[0] if not current_active.empty else None

        counter_records.append({
            "counter_id": c.id,
            "counter_number": c.counter_number,
            "name": c.name,
            "status": c.status,
            "operator_name": c.operator_name,
            "active_token_number": active_tok_str,
            "served_count": int(served_num)
        })

    # Hourly throughput distribution
    df["hour"] = df["created_at"].apply(lambda dt: dt.strftime("%H:00") if dt else "09:00")
    hourly = df.groupby("hour").agg(
        created=("id", "count"),
        served=("status", lambda s: (s == "SERVED").sum())
    ).reset_index()

    throughput_hourly = []
    for _, row in hourly.iterrows():
        throughput_hourly.append({
            "hour": row["hour"],
            "created": int(row["created"]),
            "served": int(row["served"])
        })

    # Calculate overall Queue Health Score (0-100)
    # Higher waiting times & high unserved ratio lower the score
    health_penalty = min(50, waiting_count * 2.5) + min(30, max(0, avg_wait - 5) * 2)
    health_score = max(20, int(100 - health_penalty))

    return {
        "total_tokens": total_tokens,
        "waiting_count": waiting_count,
        "called_count": called_count,
        "served_count": served_count,
        "skipped_count": skipped_count,
        "avg_wait_mins": avg_wait,
        "priority_breakdown": priority_breakdown,
        "service_bottlenecks": service_bottlenecks,
        "counter_efficiency": counter_records,
        "throughput_hourly": throughput_hourly,
        "health_score": health_score
    }
