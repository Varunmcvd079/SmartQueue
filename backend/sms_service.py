from datetime import datetime
import os
import uuid
from typing import List, Dict, Any, Optional

sms_dispatch_logs: List[Dict[str, Any]] = []

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+18005550199")

def send_sms_notification(
    to_phone: str,
    message: str,
    token_number: Optional[str] = None,
    event_type: str = "TOKEN_UPDATE"
) -> Dict[str, Any]:
    """
    Sends an SMS notification via Twilio if credentials are configured,
    or generates an authenticated enterprise mock dispatch log.
    """
    cleaned_phone = to_phone.strip() if to_phone else "+15550000000"
    msg_id = f"SM_{uuid.uuid4().hex[:16]}"
    
    status = "DELIVERED"
    provider = "TWILIO_STUB"
    
    # If live Twilio credentials exist, attempt real Twilio dispatch
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            res = client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=cleaned_phone
            )
            msg_id = res.sid
            status = res.status or "SENT"
            provider = "TWILIO_LIVE"
        except Exception as e:
            status = f"SIMULATED_FALLBACK ({str(e)})"

    log_entry = {
        "id": msg_id,
        "recipient": cleaned_phone,
        "token_number": token_number,
        "event_type": event_type,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "status": status,
        "provider": provider
    }
    
    # Keep latest 100 dispatch logs in memory
    sms_dispatch_logs.insert(0, log_entry)
    if len(sms_dispatch_logs) > 100:
        sms_dispatch_logs.pop()
        
    return log_entry

def get_notification_logs(limit: int = 30) -> List[Dict[str, Any]]:
    return sms_dispatch_logs[:limit]
