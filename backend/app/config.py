from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str

    # anthropic
    anthropic_api_key: str

    # Resend
    resend_api_key: Optional[str] = None

    # Interswitch (sandbox)
    interswitch_base_url: str = "https://qa.interswitchng.com"
    interswitch_client_id: str
    interswitch_secret: str
    interswitch_merchant_code: str
    interswitch_pay_item_id: str
    interswitch_entity_code: Optional[str] = None

    # App
    app_url: str  # e.g. https://pactai.com — used for signing link URLs

    # email
    gmail_address: str
    gmail_app_password: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()