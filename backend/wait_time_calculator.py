import sympy as sp
from typing import Dict, Any

# Define SymPy symbolic symbols
P = sp.Symbol('P', positive=True)             # Effective queue position ahead
S_avg = sp.Symbol('S_avg', positive=True)     # Average service time (minutes)
C_active = sp.Symbol('C_active', positive=True) # Number of active counters
U_factor = sp.Symbol('U_factor', positive=True) # Urgency attenuation factor

# Core Symbolic Formula:
# W = (P * S_avg * U_factor) / C_active
W_symbolic = (P * S_avg * U_factor) / C_active

# Derivatives for sensitivity analysis:
dW_dC = sp.diff(W_symbolic, C_active)
dW_dS = sp.diff(W_symbolic, S_avg)

# Priority urgency attenuation factors
PRIORITY_URGENCY_FACTORS = {
    "EMERGENCY": 0.4,       # Accelerated / direct queue access
    "VIP": 0.7,             # Priority desk routing
    "SENIOR_CITIZEN": 0.85, # Dedicated attention factor
    "NORMAL": 1.0           # Standard linear flow
}

def calculate_symbolic_wait_time(
    position_ahead: int,
    avg_service_time: float,
    active_counters: int,
    priority_level: str = "NORMAL"
) -> Dict[str, Any]:
    """
    Computes estimated wait time dynamically using SymPy symbolic evaluation.
    Returns calculated wait minutes, sensitivity insights, and symbolic formula representation.
    """
    safe_counters = max(1, active_counters)
    safe_position = max(0, position_ahead)
    u_val = PRIORITY_URGENCY_FACTORS.get(priority_level.upper(), 1.0)
    avg_time = max(1.0, float(avg_service_time))

    if safe_position == 0:
        return {
            "estimated_wait_mins": 0.0,
            "position_ahead": 0,
            "active_counters": safe_counters,
            "urgency_factor": u_val,
            "sensitivity_counter_delta": 0.0,
            "formula_latex": sp.latex(W_symbolic),
            "formula_readable": "W = (P * S_avg * U_factor) / C_active",
            "calculation_steps": f"Token is next in line! Position 0 -> 0.0 mins."
        }

    # Evaluate using SymPy subs and evalf
    evaluated_w = W_symbolic.subs({
        P: safe_position,
        S_avg: avg_time,
        C_active: safe_counters,
        U_factor: u_val
    }).evalf()

    # Sensitivity calculation: how much would wait decrease if 1 extra counter was opened?
    sensitivity_val = dW_dC.subs({
        P: safe_position,
        S_avg: avg_time,
        C_active: safe_counters,
        U_factor: u_val
    }).evalf()

    wait_mins = round(float(evaluated_w), 1)
    # Ensure minimum 1.0 min if position > 0
    wait_mins = max(1.0, wait_mins)

    return {
        "estimated_wait_mins": wait_mins,
        "position_ahead": safe_position,
        "active_counters": safe_counters,
        "urgency_factor": u_val,
        "sensitivity_counter_delta": round(float(sensitivity_val), 2),
        "formula_latex": sp.latex(W_symbolic),
        "formula_readable": "W = (P * S_avg * U_factor) / C_active",
        "calculation_steps": (
            f"({safe_position} ahead * {avg_time}m avg * {u_val} factor) "
            f"/ {safe_counters} active counters = {wait_mins} mins"
        )
    }

def get_symbolic_meta():
    """Returns mathematical and symbolic metadata for Admin Inspector"""
    return {
        "formula_expression": str(W_symbolic),
        "latex": sp.latex(W_symbolic),
        "derivative_active_counters_latex": sp.latex(dW_dC),
        "derivative_service_time_latex": sp.latex(dW_dS),
        "variables": {
            "P": "Effective Queue Position Ahead in Priority Tier",
            "S_avg": "Average Service Time (minutes)",
            "C_active": "Currently Active Service Desks / Counters",
            "U_factor": "Priority Tier Attenuation (0.4 Emergency, 0.7 VIP, 0.85 Senior, 1.0 Normal)"
        }
    }
