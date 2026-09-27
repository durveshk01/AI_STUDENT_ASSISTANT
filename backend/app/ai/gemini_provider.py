from typing import List
import os
from google import genai
from google.genai import types
from pydantic import BaseModel
from .provider import AIProvider

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.embedding_model = "gemini-embedding-001"
        # Keep this in sync with DocumentChunk.embedding and the persisted
        # pgvector(3072) column. Gemini returns 3072 dimensions by default.
        self.embedding_dimensions = 3072
        self.generation_model = os.getenv("GEMINI_GENERATION_MODEL", "gemini-3.8-flash")

    def _call_with_retries(self, operation: str, request):
        """Retry temporary Gemini capacity and rate-limit errors."""
        import time
        from google.genai.errors import APIError

        retries = 3
        for attempt in range(retries + 1):
            try:
                return request()
            except APIError as error:
                if error.code not in {429, 500, 503} or attempt == retries:
                    raise
                delay = 30 if error.code == 429 else 2 ** attempt
                print(
                    f"Gemini {operation} returned {error.code}; retrying in {delay}s "
                    f"({retries - attempt} retries left).",
                    flush=True,
                )
                time.sleep(delay)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        # The new genai SDK might fail if we send too many in one batch.
        # Batch inputs and retry transient capacity/rate-limit errors.
        all_embeddings = []
        batch_size = 20
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            response = self._call_with_retries(
                "embeddings",
                lambda: self.client.models.embed_content(
                        model=self.embedding_model,
                        contents=batch,
                        config=types.EmbedContentConfig(
                            output_dimensionality=self.embedding_dimensions,
                        ),
                    ),
            )
            batch_embeddings = [embedding.values for embedding in response.embeddings]
            if len(batch_embeddings) != len(batch):
                raise ValueError(
                    f"Gemini returned {len(batch_embeddings)} embeddings for {len(batch)} inputs."
                )
            if any(len(embedding) != self.embedding_dimensions for embedding in batch_embeddings):
                raise ValueError(
                    f"Gemini returned an embedding with an unexpected dimension; expected {self.embedding_dimensions}."
                )
            all_embeddings.extend(batch_embeddings)
                
        return all_embeddings

    def generate_answer(self, prompt: str, context: str) -> str:
        full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        response = self._call_with_retries(
            "generation",
            lambda: self.client.models.generate_content(
                model=self.generation_model,
                contents=full_prompt,
            ),
        )
        return response.text

    def generate_answer_stream_sync(self, prompt: str, context: str):
        """Synchronous streaming — safe to call from a sync def endpoint."""
        full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        response = self.client.models.generate_content_stream(
            model=self.generation_model,
            contents=full_prompt
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text

    async def generate_answer_stream(self, prompt: str, context: str):
        """Async streaming — uses the async client to avoid blocking the event loop."""
        full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        async_response = await self.client.aio.models.generate_content_stream(
            model=self.generation_model,
            contents=full_prompt
        )
        async for chunk in async_response:
            if chunk.text:
                yield chunk.text

    def generate_structured(self, prompt: str, context: str, response_schema: type) -> any:
        full_prompt = f"Context:\n{context}\n\nPrompt:\n{prompt}"
        response = self._call_with_retries(
            "structured generation",
            lambda: self.client.models.generate_content(
                model=self.generation_model,
                contents=full_prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            ),
        )
        # Parse the JSON response into the Pydantic model
        return response_schema.model_validate_json(response.text)
