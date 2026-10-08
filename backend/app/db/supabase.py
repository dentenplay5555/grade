from supabase import create_client, Client
from app.config import settings

_supabase_admin_client: Client = None

def get_supabase_admin_client() -> Client:
    """
    Returns the server-side Supabase client with service_role key.
    Bypasses RLS. Used exclusively for administrative operations and Grader Worker.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            # Fallback mock for testing or incomplete env
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_admin_client

def get_supabase_user_client(access_token: str) -> Client:
    """
    Returns a scoped Supabase client authenticated as the user's JWT.
    Enforces RLS.
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )
    client.postgrest.auth(access_token)
    return client
