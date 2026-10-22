import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Service, Counter, Token, QueueLog, User
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role
)
from .wait_time_calculator import calculate_symbolic_wait_time, get_symbolic_meta
from .priority_engine import (
    compute_effective_priority,
    get_ordered_waiting_queue,
    refresh_queue_estimates
)
from .sms_service import send_sms_notification, get_notification_logs
from .analytics import generate_analytics_summary

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartQueue RBAC API",
    description="Intelligent Queue Management System with Strict Role-Based Access Control and SymPy Predictive Math",
    version="2.5.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for dead in disconnected:
            self.disconnect(dead)

ws_manager = ConnectionManager()

# --- Pydantic Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenGenerateRequest(BaseModel):
    service_id: int
    customer_name: str
    phone: Optional[str] = ""
    priority_level: str = "NORMAL"  # NORMAL, VIP, SENIOR_CITIZEN, EMERGENCY
    send_sms: bool = True

class CounterCallNextRequest(BaseModel):
    counter_id: int

class CounterActionRequest(BaseModel):
    counter_id: int
    action: str  # COMPLETED, SKIPPED, HOLD, TRANSFERRED
    transfer_service_id: Optional[int] = None
    notes: Optional[str] = None

class CounterStatusRequest(BaseModel):
    status: str  # ACTIVE, PAUSED, OFFLINE

class ServiceCreateRequest(BaseModel):
    name: str
    prefix: str
    avg_service_time_mins: float = 5.0
    description: Optional[str] = ""
    icon: Optional[str] = "HelpCircle"

class CounterCreateRequest(BaseModel):
    counter_number: int
    name: str
    service_id: Optional[int] = None
    assigned_staff_id: Optional[int] = None

class AssignStaffRequest(BaseModel):
    staff_id: int

class StaffCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "STAFF"  # 'STAFF' or 'ADMIN'
    department_id: Optional[int] = None

# --- Seed Initial Database State ---
def seed_initial_data(db: Session):
    # 1. Services
    s1 = Service(name="General Inquiry", prefix="A", avg_service_time_mins=4.0, description="General queries, forms, and general ticketing", icon="HelpCircle")
    s2 = Service(name="Financial Desk", prefix="B", avg_service_time_mins=6.5, description="Tuition, cashier, payroll, and student billing", icon="DollarSign")
    s3 = Service(name="Academic Affairs", prefix="U", avg_service_time_mins=8.0, description="Transcripts, registration, and expedited advising", icon="AlertTriangle")
    s4 = Service(name="VIP Services", prefix="V", avg_service_time_mins=5.0, description="Executive visitors, international delegates, and priority relations", icon="Crown")

    db.add_all([s1, s2, s3, s4])
    db.commit()

    # 2. Staff & Admin Accounts
    admin_user = User(
        username="admin",
        email="admin@smartqueue.io",
        password_hash=hash_password("admin123"),
        role="ADMIN"
    )
    staff1 = User(
        username="staff_sarah",
        email="sarah@smartqueue.io",
        password_hash=hash_password("staff123"),
        role="STAFF",
        department_id=s1.id
    )
    staff2 = User(
        username="staff_chen",
        email="chen@smartqueue.io",
        password_hash=hash_password("staff123"),
        role="STAFF",
        department_id=s2.id
    )
    staff3 = User(
        username="staff_elena",
        email="elena@smartqueue.io",
        password_hash=hash_password("staff123"),
        role="STAFF",
        department_id=s3.id
    )
    db.add_all([admin_user, staff1, staff2, staff3])
    db.commit()

    # 3. Counters with Assigned Staff
    c1 = Counter(counter_number=1, name="General Inquiry 01", service_id=s1.id, status="ACTIVE", assigned_staff_id=staff1.id, operator_name=staff1.username)
    c2 = Counter(counter_number=2, name="Financial Desk 01", service_id=s2.id, status="ACTIVE", assigned_staff_id=staff2.id, operator_name=staff2.username)
    c3 = Counter(counter_number=3, name="Financial Desk 02", service_id=s2.id, status="ACTIVE", assigned_staff_id=staff2.id, operator_name=staff2.username)
    c4 = Counter(counter_number=4, name="Academic Affairs 01", service_id=s3.id, status="ACTIVE", assigned_staff_id=staff3.id, operator_name=staff3.username)
    c5 = Counter(counter_number=5, name="Executive Desk", service_id=s4.id, status="ACTIVE", assigned_staff_id=admin_user.id, operator_name=admin_user.username)

    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # 4. Realistic Demo Tokens in Queue
    now = datetime.utcnow()
    initial_tokens = [
        Token(token_number="A-101", service_id=s1.id, customer_name="Marcus Vance", phone="+1 (555) 234-5678", priority_level="NORMAL", status="CALLED", counter_id=c1.id, called_at=now),
        Token(token_number="B-101", service_id=s2.id, customer_name="Dr. Arthur Pendelton", phone="+1 (555) 345-6789", priority_level="VIP", status="CALLED", counter_id=c2.id, called_at=now),
        Token(token_number="U-101", service_id=s3.id, customer_name="Olivia Sterling", phone="+1 (555) 456-7890", priority_level="EMERGENCY", status="CALLED", counter_id=c4.id, called_at=now),
        Token(token_number="A-102", service_id=s1.id, customer_name="Grace Hopper", phone="+1 (555) 567-8901", priority_level="SENIOR_CITIZEN", status="WAITING", estimated_wait_mins=3.5),
        Token(token_number="A-103", service_id=s1.id, customer_name="David Patel", phone="+1 (555) 678-9012", priority_level="NORMAL", status="WAITING", estimated_wait_mins=7.0),
        Token(token_number="B-102", service_id=s2.id, customer_name="Sophie Turner", phone="+1 (555) 789-0123", priority_level="NORMAL", status="WAITING", estimated_wait_mins=6.5),
        Token(token_number="V-101", service_id=s4.id, customer_name="Dean Alexander Knight", phone="+1 (555) 890-1234", priority_level="VIP", status="WAITING", estimated_wait_mins=4.0),
    ]
    db.add_all(initial_tokens)
    db.commit()

    c1.active_token_id = initial_tokens[0].id
    c2.active_token_id = initial_tokens[1].id
    c4.active_token_id = initial_tokens[2].id

    # Queue Logs
    l1 = QueueLog(token_id=initial_tokens[0].id, counter_id=c1.id, action="CALLED", details="Counter 01 called token A-101")
    l2 = QueueLog(token_id=initial_tokens[1].id, counter_id=c2.id, action="CALLED", details="Counter 02 called VIP token B-101")
    l3 = QueueLog(token_id=initial_tokens[2].id, counter_id=c4.id, action="CALLED", details="Counter 04 called Emergency token U-101")
    db.add_all([l1, l2, l3])
    db.commit()

    refresh_queue_estimates(db)

@app.on_event("startup")
def startup_init():
    db = next(get_db())
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            seed_initial_data(db)
    finally:
        db.close()

# --- WebSocket Endpoint ---
@app.websocket("/ws/queue")
async def websocket_queue(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# ==============================================================================
# 1. AUTHENTICATION ENDPOINTS
# ==============================================================================

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username.strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please check your credentials."
        )

    # Issue JWT with role embedded
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None
        }
    }

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "department_name": current_user.department.name if current_user.department else None
    }

# ==============================================================================
# 2. PUBLIC & GUEST ENDPOINTS (No Authentication Required)
# ==============================================================================

@app.get("/api/services")
def list_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    result = []
    for s in services:
        waiting_count = db.query(Token).filter(Token.service_id == s.id, Token.status == "WAITING").count()
        result.append({
            "id": s.id,
            "name": s.name,
            "prefix": s.prefix,
            "avg_service_time_mins": s.avg_service_time_mins,
            "description": s.description,
            "icon": s.icon,
            "waiting_count": waiting_count
        })
    return result

@app.get("/api/counters")
def list_counters(db: Session = Depends(get_db)):
    counters = db.query(Counter).order_by(Counter.counter_number.asc()).all()
    result = []
    for c in counters:
        active_tok = None
        if c.active_token:
            active_tok = {
                "id": c.active_token.id,
                "token_number": c.active_token.token_number,
                "customer_name": c.active_token.customer_name,
                "priority_level": c.active_token.priority_level,
                "called_at": c.active_token.called_at.isoformat() if c.active_token.called_at else None,
                "notes": c.active_token.notes
            }
        result.append({
            "id": c.id,
            "counter_number": c.counter_number,
            "name": c.name,
            "service_id": c.service_id,
            "service_name": c.service.name if c.service else "Multi-Service Desk",
            "status": c.status,
            "assigned_staff_id": c.assigned_staff_id,
            "operator_name": c.assigned_staff.username if c.assigned_staff else (c.operator_name or "Staff"),
            "active_token": active_tok
        })
    return result

@app.post("/api/tokens/generate")
async def generate_token_endpoint(req: TokenGenerateRequest, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == req.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Selected department/service does not exist")

    today_count = db.query(Token).filter(Token.service_id == service.id).count()
    token_number = f"{service.prefix}-{101 + today_count}"

    waiting_queue = get_ordered_waiting_queue(db, service_id=service.id)
    position_ahead = len(waiting_queue)

    active_counters_count = db.query(Counter).filter(
        Counter.status == "ACTIVE",
        (Counter.service_id == service.id) | (Counter.service_id == None)
    ).count()
    active_counters_count = max(1, active_counters_count)

    calc = calculate_symbolic_wait_time(
        position_ahead=position_ahead,
        avg_service_time=service.avg_service_time_mins,
        active_counters=active_counters_count,
        priority_level=req.priority_level
    )

    new_token = Token(
        token_number=token_number,
        service_id=service.id,
        customer_name=req.customer_name.strip(),
        phone=req.phone.strip() if req.phone else "",
        priority_level=req.priority_level.upper(),
        status="WAITING",
        estimated_wait_mins=calc["estimated_wait_mins"],
        created_at=datetime.utcnow()
    )
    db.add(new_token)
    db.commit()
    db.refresh(new_token)

    log = QueueLog(
        token_id=new_token.id,
        action="GENERATED",
        details=f"Token {token_number} generated for {req.customer_name} ({req.priority_level})"
    )
    db.add(log)
    db.commit()

    refresh_queue_estimates(db, service_id=service.id)

    sms_res = None
    if req.send_sms and req.phone:
        msg = (
            f"SmartQueue: Hello {req.customer_name}, your token is {token_number} for {service.name}. "
            f"Estimated wait time is ~{calc['estimated_wait_mins']} mins. Track live at /ticket?token={token_number}"
        )
        sms_res = send_sms_notification(
            to_phone=req.phone,
            message=msg,
            token_number=token_number,
            event_type="TOKEN_ISSUED"
        )

    await ws_manager.broadcast({
        "event": "TOKEN_GENERATED",
        "token_number": token_number,
        "service_name": service.name,
        "estimated_wait_mins": calc["estimated_wait_mins"]
    })

    return {
        "success": True,
        "token": {
            "id": new_token.id,
            "token_number": new_token.token_number,
            "service_id": service.id,
            "service_name": service.name,
            "customer_name": new_token.customer_name,
            "phone": new_token.phone,
            "priority_level": new_token.priority_level,
            "status": new_token.status,
            "estimated_wait_mins": new_token.estimated_wait_mins,
            "position_ahead": position_ahead,
            "created_at": new_token.created_at.isoformat(),
            "calculation_steps": calc["calculation_steps"],
            "formula_latex": calc["formula_latex"]
        },
        "sms_notification": sms_res
    }

@app.get("/api/queue/live")
def get_live_queue(db: Session = Depends(get_db)):
    counters = db.query(Counter).order_by(Counter.counter_number.asc()).all()
    services = db.query(Service).all()
    services_map = {s.id: s.name for s in services}

    now_serving = []
    active_count = 0
    for c in counters:
        if c.status == "ACTIVE":
            active_count += 1
        if c.active_token and c.active_token.status == "CALLED":
            tok = c.active_token
            elapsed_sec = (datetime.utcnow() - (tok.called_at or datetime.utcnow())).total_seconds()
            now_serving.append({
                "counter_id": c.id,
                "counter_number": c.counter_number,
                "counter_name": c.name,
                "token_id": tok.id,
                "token_number": tok.token_number,
                "customer_name": tok.customer_name,
                "service_name": services_map.get(tok.service_id, "General Desk"),
                "priority_level": tok.priority_level,
                "status": "In Service",
                "called_at": tok.called_at.isoformat() if tok.called_at else None,
                "elapsed_service_mins": round(elapsed_sec / 60.0, 1),
                "operator_name": c.assigned_staff.username if c.assigned_staff else (c.operator_name or "Staff")
            })

    ordered_tokens = get_ordered_waiting_queue(db)
    waiting_list = []
    for idx, t in enumerate(ordered_tokens):
        wait_elapsed = 0.0
        if t.created_at:
            wait_elapsed = (datetime.utcnow() - t.created_at).total_seconds() / 60.0
        waiting_list.append({
            "id": t.id,
            "token_number": t.token_number,
            "customer_name": t.customer_name,
            "service_id": t.service_id,
            "service_name": services_map.get(t.service_id, "Service"),
            "priority_level": t.priority_level,
            "status": t.status,
            "estimated_wait_mins": t.estimated_wait_mins,
            "elapsed_wait_mins": round(wait_elapsed, 1),
            "queue_position": idx + 1
        })

    total_served = db.query(Token).filter(Token.status == "SERVED").count()
    avg_times = [s.avg_service_time_mins for s in services]
    avg_svc = round(sum(avg_times) / max(1, len(avg_times)), 1) if avg_times else 5.0
    density = "OPTIMAL" if len(waiting_list) < 5 else ("MODERATE" if len(waiting_list) < 12 else "CONGESTED")

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "now_serving": now_serving,
        "waiting_list": waiting_list,
        "total_waiting": len(waiting_list),
        "total_served_today": total_served,
        "active_counters_count": active_count,
        "total_counters": len(counters),
        "avg_service_time_mins": avg_svc,
        "queue_density": density
    }

@app.get("/api/tokens/ticket/{token_number}")
def get_personal_ticket(token_number: str, db: Session = Depends(get_db)):
    """Personal ticket tracker endpoint for visitors"""
    token = db.query(Token).filter(Token.token_number == token_number.upper()).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token ticket not found")

    service = db.query(Service).filter(Service.id == token.service_id).first()
    waiting_queue = get_ordered_waiting_queue(db, service_id=token.service_id)
    pos = 0
    for idx, t in enumerate(waiting_queue):
        if t.id == token.id:
            pos = idx
            break

    active_counters = db.query(Counter).filter(
        Counter.status == "ACTIVE",
        (Counter.service_id == token.service_id) | (Counter.service_id == None)
    ).count()
    active_counters = max(1, active_counters)

    calc = calculate_symbolic_wait_time(
        position_ahead=pos,
        avg_service_time=service.avg_service_time_mins if service else 5.0,
        active_counters=active_counters,
        priority_level=token.priority_level
    )

    return {
        "id": token.id,
        "token_number": token.token_number,
        "service_name": service.name if service else "General Desk",
        "customer_name": token.customer_name,
        "phone": token.phone,
        "priority_level": token.priority_level,
        "status": token.status,
        "counter_number": token.counter.counter_number if token.counter else None,
        "counter_name": token.counter.name if token.counter else "Assigned upon summon",
        "estimated_wait_mins": token.estimated_wait_mins if token.status == "WAITING" else 0.0,
        "position_ahead": pos,
        "created_at": token.created_at.isoformat() if token.created_at else None,
        "called_at": token.called_at.isoformat() if token.called_at else None,
        "calculation_steps": calc["calculation_steps"],
        "formula_latex": calc["formula_latex"]
    }

@app.get("/api/notifications/logs")
def get_logs():
    return get_notification_logs()

# ==============================================================================
# 3. STAFF & OPERATOR ENDPOINTS (Protected: STAFF or ADMIN)
# ==============================================================================

@app.post("/api/counter/call-next")
async def call_next_token(
    req: CounterCallNextRequest,
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    counter = db.query(Counter).filter(Counter.id == req.counter_id).first()
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")

    if counter.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Cannot call next ticket while counter is paused or offline")

    # If counter currently has a CALLED token, mark it as SERVED
    if counter.active_token_id:
        prev = db.query(Token).filter(Token.id == counter.active_token_id).first()
        if prev and prev.status == "CALLED":
            prev.status = "SERVED"
            prev.served_at = datetime.utcnow()
            prev.completed_at = datetime.utcnow()
            log = QueueLog(token_id=prev.id, counter_id=counter.id, action="COMPLETED", details=f"Served by {current_user.username}")
            db.add(log)

    waiting_tokens = get_ordered_waiting_queue(db, service_id=counter.service_id)
    if not waiting_tokens and counter.service_id is not None:
        waiting_tokens = get_ordered_waiting_queue(db)

    if not waiting_tokens:
        counter.active_token_id = None
        db.commit()
        await ws_manager.broadcast({"event": "QUEUE_EMPTY", "counter_id": counter.id})
        return {"success": True, "message": "No waiting tokens in line", "token": None}

    next_token = waiting_tokens[0]
    next_token.status = "CALLED"
    next_token.called_at = datetime.utcnow()
    next_token.counter_id = counter.id
    counter.active_token_id = next_token.id

    log = QueueLog(
        token_id=next_token.id,
        counter_id=counter.id,
        action="CALLED",
        details=f"Counter {counter.counter_number:02d} called token {next_token.token_number} by {current_user.username}"
    )
    db.add(log)
    db.commit()

    refresh_queue_estimates(db)

    # Dispatch Call Alert SMS
    sms_res = None
    if next_token.phone:
        msg = f"ALERT: Token {next_token.token_number}! Please proceed to Counter {counter.counter_number:02d} ({counter.name}) immediately."
        sms_res = send_sms_notification(
            to_phone=next_token.phone,
            message=msg,
            token_number=next_token.token_number,
            event_type="TOKEN_CALLED"
        )

    await ws_manager.broadcast({
        "event": "TOKEN_CALLED",
        "counter_number": counter.counter_number,
        "token_number": next_token.token_number,
        "customer_name": next_token.customer_name,
        "service_name": next_token.service.name if next_token.service else "Desk"
    })

    return {
        "success": True,
        "counter_id": counter.id,
        "counter_number": counter.counter_number,
        "token": {
            "id": next_token.id,
            "token_number": next_token.token_number,
            "customer_name": next_token.customer_name,
            "phone": next_token.phone,
            "priority_level": next_token.priority_level,
            "status": next_token.status,
            "called_at": next_token.called_at.isoformat()
        },
        "sms_notification": sms_res
    }

@app.post("/api/counter/action")
async def execute_counter_action(
    req: CounterActionRequest,
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    counter = db.query(Counter).filter(Counter.id == req.counter_id).first()
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")

    action = req.action.upper()
    active_token = db.query(Token).filter(Token.id == counter.active_token_id).first() if counter.active_token_id else None

    if action in ["COMPLETE", "COMPLETED", "SERVED"]:
        if active_token:
            active_token.status = "SERVED"
            active_token.served_at = datetime.utcnow()
            active_token.completed_at = datetime.utcnow()
            if req.notes:
                active_token.notes = req.notes
            log = QueueLog(token_id=active_token.id, counter_id=counter.id, action="COMPLETED", details=req.notes or f"Completed by {current_user.username}")
            db.add(log)
        counter.active_token_id = None
        db.commit()

    elif action in ["SKIP", "SKIPPED"]:
        if active_token:
            active_token.status = "SKIPPED"
            log = QueueLog(token_id=active_token.id, counter_id=counter.id, action="SKIPPED", details=req.notes or f"Skipped/Absent by {current_user.username}")
            db.add(log)
        counter.active_token_id = None
        db.commit()

    elif action == "HOLD":
        if active_token:
            active_token.status = "WAITING"
            log = QueueLog(token_id=active_token.id, counter_id=counter.id, action="HOLD", details=f"Held by {current_user.username}")
            db.add(log)
        counter.active_token_id = None
        db.commit()

    elif action in ["TRANSFER", "TRANSFERRED"]:
        if not active_token:
            raise HTTPException(status_code=400, detail="No active ticket to transfer")
        if not req.transfer_service_id:
            raise HTTPException(status_code=400, detail="Target department/service ID required")

        target_service = db.query(Service).filter(Service.id == req.transfer_service_id).first()
        if not target_service:
            raise HTTPException(status_code=404, detail="Target transfer service not found")

        active_token.service_id = target_service.id
        active_token.status = "WAITING"
        active_token.counter_id = None
        counter.active_token_id = None

        log = QueueLog(
            token_id=active_token.id,
            counter_id=counter.id,
            action="TRANSFERRED",
            details=f"Transferred from Counter {counter.counter_number:02d} to {target_service.name} by {current_user.username}"
        )
        db.add(log)
        db.commit()

    refresh_queue_estimates(db)
    await ws_manager.broadcast({"event": "COUNTER_ACTION", "counter_id": counter.id, "action": action})
    return {"success": True, "counter_id": counter.id, "action": action}

@app.post("/api/counters/{counter_id}/status")
async def toggle_counter_status(
    counter_id: int,
    req: CounterStatusRequest,
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    counter = db.query(Counter).filter(Counter.id == counter_id).first()
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")

    counter.status = req.status.upper()
    db.commit()
    refresh_queue_estimates(db, counter.service_id)
    await ws_manager.broadcast({"event": "COUNTER_STATUS_CHANGED", "counter_id": counter.id, "status": counter.status})
    return {"success": True, "counter_id": counter.id, "status": counter.status}

# ==============================================================================
# 4. ADMIN CONTROL PORTAL ENDPOINTS (Strict: ADMIN Role)
# ==============================================================================

@app.get("/api/admin/services")
def admin_list_services(current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    return db.query(Service).all()

@app.post("/api/admin/services")
def admin_create_service(req: ServiceCreateRequest, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    svc = Service(
        name=req.name.strip(),
        prefix=req.prefix.strip().upper(),
        avg_service_time_mins=req.avg_service_time_mins,
        description=req.description,
        icon=req.icon or "HelpCircle"
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc

@app.put("/api/admin/services/{service_id}")
def admin_update_service(service_id: int, req: ServiceCreateRequest, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.name = req.name.strip()
    svc.prefix = req.prefix.strip().upper()
    svc.avg_service_time_mins = req.avg_service_time_mins
    svc.description = req.description
    svc.icon = req.icon or svc.icon
    db.commit()
    return svc

@app.delete("/api/admin/services/{service_id}")
def admin_delete_service(service_id: int, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
    return {"success": True, "message": "Service deleted"}

@app.get("/api/admin/counters")
def admin_list_counters(current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    counters = db.query(Counter).order_by(Counter.counter_number.asc()).all()
    res = []
    for c in counters:
        res.append({
            "id": c.id,
            "counter_number": c.counter_number,
            "name": c.name,
            "service_id": c.service_id,
            "service_name": c.service.name if c.service else "Unassigned",
            "status": c.status,
            "assigned_staff_id": c.assigned_staff_id,
            "assigned_staff_name": c.assigned_staff.username if c.assigned_staff else None
        })
    return res

@app.post("/api/admin/counters")
def admin_create_counter(req: CounterCreateRequest, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    c = Counter(
        counter_number=req.counter_number,
        name=req.name.strip(),
        service_id=req.service_id,
        assigned_staff_id=req.assigned_staff_id,
        status="ACTIVE"
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.post("/api/admin/counters/{counter_id}/assign-staff")
def admin_assign_counter_staff(counter_id: int, req: AssignStaffRequest, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    c = db.query(Counter).filter(Counter.id == counter_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Counter not found")
    staff = db.query(User).filter(User.id == req.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff account not found")
    c.assigned_staff_id = staff.id
    c.operator_name = staff.username
    db.commit()
    return {"success": True, "counter_id": c.id, "assigned_staff": staff.username}

@app.get("/api/admin/staff")
def admin_list_staff(current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "department_id": u.department_id,
        "department_name": u.department.name if u.department else "Unassigned"
    } for u in users]

@app.post("/api/admin/staff")
def admin_create_staff(req: StaffCreateRequest, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = User(
        username=req.username.strip(),
        email=req.email.strip(),
        password_hash=hash_password(req.password),
        role=req.role.upper(),
        department_id=req.department_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "id": user.id, "username": user.username, "role": user.role}

@app.get("/api/admin/audit-logs")
def admin_get_audit_logs(limit: int = 50, current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    """Live stream of all system queue actions"""
    logs = db.query(QueueLog).order_by(QueueLog.timestamp.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "token_id": l.token_id,
        "token_number": l.token.token_number if l.token else None,
        "counter_id": l.counter_id,
        "counter_number": l.counter.counter_number if l.counter else None,
        "action": l.action,
        "timestamp": l.timestamp.isoformat(),
        "details": l.details
    } for l in logs]

@app.post("/api/admin/seed")
async def admin_reseed(current_user: User = Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    db.query(QueueLog).delete()
    db.query(Token).delete()
    db.query(Counter).delete()
    db.query(User).delete()
    db.query(Service).delete()
    db.commit()

    seed_initial_data(db)
    await ws_manager.broadcast({"event": "DATA_RESEEDED"})
    return {"success": True, "message": "System database reset & seeded with default Admin & Staff accounts"}

@app.get("/api/analytics/summary")
def get_analytics(db: Session = Depends(get_db)):
    return generate_analytics_summary(db)

@app.get("/api/analytics/sympy-formula")
def get_sympy_formula():
    return get_symbolic_meta()

# Mount Frontend static files
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
