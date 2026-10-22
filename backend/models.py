from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="STAFF")  # 'ADMIN', 'STAFF'
    department_id = Column(Integer, ForeignKey("services.id"), nullable=True)

    department = relationship("Service", back_populates="staff_members")
    assigned_counters = relationship("Counter", back_populates="assigned_staff")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    prefix = Column(String(5), nullable=False)
    avg_service_time_mins = Column(Float, default=5.0)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), default="HelpCircle")

    tokens = relationship("Token", back_populates="service", foreign_keys="Token.service_id")
    counters = relationship("Counter", back_populates="service")
    staff_members = relationship("User", back_populates="department")

class Counter(Base):
    __tablename__ = "counters"

    id = Column(Integer, primary_key=True, index=True)
    counter_number = Column(Integer, unique=True, nullable=False)
    name = Column(String(100), default="General Desk")
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    status = Column(String(20), default="ACTIVE")  # 'ACTIVE', 'PAUSED', 'OFFLINE'
    assigned_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_name = Column(String(100), default="Operator")
    active_token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)

    service = relationship("Service", back_populates="counters")
    assigned_staff = relationship("User", back_populates="assigned_counters")
    active_token = relationship("Token", foreign_keys=[active_token_id], post_update=True)
    logs = relationship("QueueLog", back_populates="counter")

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(String(20), unique=True, index=True, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    customer_name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    priority_level = Column(String(30), default="NORMAL")  # 'NORMAL', 'VIP', 'SENIOR_CITIZEN', 'EMERGENCY'
    status = Column(String(30), default="WAITING")  # 'WAITING', 'CALLED', 'SERVED', 'SKIPPED', 'CANCELLED'
    estimated_wait_mins = Column(Float, default=0.0)
    counter_id = Column(Integer, ForeignKey("counters.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    called_at = Column(DateTime, nullable=True)
    served_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    service = relationship("Service", back_populates="tokens", foreign_keys=[service_id])
    counter = relationship("Counter", foreign_keys=[counter_id])
    logs = relationship("QueueLog", back_populates="token")

class QueueLog(Base):
    __tablename__ = "queue_logs"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    counter_id = Column(Integer, ForeignKey("counters.id"), nullable=True)
    action = Column(String(50), nullable=False)  # 'GENERATED', 'CALLED', 'SKIPPED', 'TRANSFERRED', 'COMPLETED'
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String(255), nullable=True)

    token = relationship("Token", back_populates="logs")
    counter = relationship("Counter", back_populates="logs")
