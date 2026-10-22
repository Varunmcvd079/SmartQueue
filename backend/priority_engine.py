from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Token, Counter, Service
from .wait_time_calculator import calculate_symbolic_wait_time

BASE_PRIORITY_SCORES = {
    "EMERGENCY": 1000.0,
    "VIP": 400.0,
    "SENIOR_CITIZEN": 300.0,
    "NORMAL": 100.0
}

# Aging rates (points added per minute of waiting to avoid starvation)
AGING_RATE_PER_MIN = 6.0
MAX_WAIT_THRESHOLD_MINS = 15.0
STARVATION_ESCALATION_BONUS = 80.0

def compute_effective_priority(token: Token) -> float:
    """
    Computes dynamic priority score combining base tier weight,
    aging bonus over elapsed waiting duration, and starvation prevention escalation.
    """
    base = BASE_PRIORITY_SCORES.get(token.priority_level.upper(), 100.0)
    
    elapsed_minutes = 0.0
    if token.created_at:
        elapsed_seconds = (datetime.utcnow() - token.created_at).total_seconds()
        elapsed_minutes = max(0.0, elapsed_seconds / 60.0)
    
    aging_bonus = elapsed_minutes * AGING_RATE_PER_MIN
    starvation_bonus = STARVATION_ESCALATION_BONUS if elapsed_minutes >= MAX_WAIT_THRESHOLD_MINS else 0.0
    
    return base + aging_bonus + starvation_bonus

def get_ordered_waiting_queue(db: Session, service_id: Optional[int] = None) -> List[Token]:
    """
    Fetches all WAITING tokens and sorts them strictly according to dynamic priority score (DESC),
    with earliest arrival time as tie-breaker.
    """
    query = db.query(Token).filter(Token.status == "WAITING")
    if service_id is not None:
        query = query.filter(Token.service_id == service_id)
        
    waiting_tokens = query.all()
    
    # Sort by (effective_score DESC, created_at ASC)
    sorted_tokens = sorted(
        waiting_tokens,
        key=lambda t: (-compute_effective_priority(t), t.created_at or datetime.utcnow())
    )
    return sorted_tokens

def refresh_queue_estimates(db: Session, service_id: Optional[int] = None):
    """
    Recalculates dynamic SymPy wait time for each waiting token based on current
    active counters and queue position ahead.
    """
    # Active counters count per service
    services = db.query(Service).all()
    for svc in services:
        if service_id is not None and svc.id != service_id:
            continue
            
        active_counters_count = db.query(Counter).filter(
            Counter.status == "ACTIVE",
            (Counter.service_id == svc.id) | (Counter.service_id == None)
        ).count()
        
        # If no active counters, assume 1 as baseline for prediction
        active_counters_count = max(1, active_counters_count)
        
        # Get prioritized waiting queue for this service
        queue = get_ordered_waiting_queue(db, service_id=svc.id)
        
        for idx, token in enumerate(queue):
            # idx is position ahead (0 means next)
            result = calculate_symbolic_wait_time(
                position_ahead=idx,
                avg_service_time=svc.avg_service_time_mins,
                active_counters=active_counters_count,
                priority_level=token.priority_level
            )
            token.estimated_wait_mins = result["estimated_wait_mins"]
            
    db.commit()
