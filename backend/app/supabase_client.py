from supabase import create_client, Client
from app.config import get_settings


def _new_client() -> Client:
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


_client: Client | None = None


def get_supabase() -> Client:
    """Return the Supabase client, recreating it if the connection went stale."""
    global _client
    if _client is None:
        _client = _new_client()
    return _client


def reset_supabase() -> Client:
    """Force-recreate the client (call after httpx connection errors)."""
    global _client
    _client = _new_client()
    return _client