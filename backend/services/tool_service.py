import asyncio
import os
import openai
from services.log_service import LogService

class ToolService:
    @staticmethod
    async def search_tool(query: str, worker_name: str) -> str:
        """Simulates a search tool."""
        LogService.log(
            agent=worker_name,
            action="tool_usage",
            status="info",
            message=f"[TOOL] {worker_name} used search_tool"
        )
        # Simulate network latency
        await asyncio.sleep(1)
        return f"Search results for '{query}': Found relevant information about the topic from multiple verified sources."

    @staticmethod
    async def llm_tool(prompt: str, worker_name: str) -> str:
        """Uses LLM to process a prompt."""
        LogService.log(
            agent=worker_name,
            action="tool_usage",
            status="info",
            message=f"[TOOL] {worker_name} used llm_tool"
        )
        
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL")
        client = openai.OpenAI(api_key=api_key, base_url=base_url) if api_key else None
        
        if not client:
            await asyncio.sleep(0.5)
            return f"LLM generated response for: {prompt}"

        try:
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a focused execution assistant. Output plain text result only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                timeout=30
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error in LLM tool: {str(e)}"
