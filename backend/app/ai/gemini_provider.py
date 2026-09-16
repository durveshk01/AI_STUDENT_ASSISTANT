from typing import List
from google import genai
from pydantic import BaseModel
from .provider import AIProvider

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.embedding_model = "text-embedding-004"
        self.generation_model = "gemini-2.5-flash"
        
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = self.client.models.embed_content(
            model=self.embedding_model,
            contents=texts
        )
        return [embedding.values for embedding in response.embeddings]

    def generate_answer(self, prompt: str, context: str) -> str:
        full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        response = self.client.models.generate_content(
            model=self.generation_model,
            contents=full_prompt
        )
        return response.text

    async def generate_answer_stream(self, prompt: str, context: str):
        full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        response = self.client.models.generate_content_stream(
            model=self.generation_model,
            contents=full_prompt
        )
        for chunk in response:
            yield chunk.text

    def generate_structured(self, prompt: str, context: str, response_schema: type) -> any:
        full_prompt = f"Context:\n{context}\n\nPrompt:\n{prompt}"
        response = self.client.models.generate_content(
            model=self.generation_model,
            contents=full_prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        # Parse the JSON response into the Pydantic model
        return response_schema.model_validate_json(response.text)
