from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # supabase
    supabase_url: str
    supabase_service_role_key: str

    # anthropic
    anthropic_api_key: str

    # Resend
    resend_api_key: str

    # Interswitch (sandbox)
    interswitch_base_url: str = "https://qa.interswitchng.com"
    interswitch_client_id: str
    interswitch_secret: str
    interswitch_merchant_code: str
    interswitch_pay_item_id: str
    interswitch_entity_code: str

    # App
    app_url: str  # e.g. https://pactai.com — used for signing link URLs

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()