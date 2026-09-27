from abc import ABC, abstractmethod
from typing import List

class AIProvider(ABC):
    @abstractmethod
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        pass
    
    @abstractmethod
    def generate_answer(self, prompt: str, context: str) -> str:
        pass
    
    @abstractmethod
    def generate_answer_stream_sync(self, prompt: str, context: str):
        """Synchronous generator for streaming — safe in threadpool endpoints."""
        pass

    @abstractmethod
    async def generate_answer_stream(self, prompt: str, context: str):
        """Async generator for streaming — use in async endpoints only."""
        pass

    @abstractmethod
    def generate_structured(self, prompt: str, context: str, response_schema: type) -> any:
        pass
