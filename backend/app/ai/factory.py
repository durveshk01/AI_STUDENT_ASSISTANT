from app.core.config import settings
from .provider import AIProvider
from .gemini_provider import GeminiProvider
import logging

def get_ai_provider() -> AIProvider:
    if settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    # Could add OpenAI or Anthropic here
    
    logging.warning("No AI API Key provided in environment variables. Falling back to dummy.")
    # Return a dummy or raise error based on preference
    raise ValueError("No AI API Key provided.")
