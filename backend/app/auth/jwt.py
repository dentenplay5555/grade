import jwt
from typing import Optional, Dict, Any
from app.config import settings

def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase Auth JWT.
    Verifies signature using SUPABASE_JWT_SECRET if configured.
    """
    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            # Unverified decode when secret is not configured locally (e.g. mock/test)
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid authentication token: {str(e)}")
