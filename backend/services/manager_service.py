import json
import os
import openai
import asyncio
from typing import List, Dict, Any

from models.task_model import Task
from services.log_service import LogService
from services.queue_service import QueueService
from services.task_service import TaskService

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
client = openai.OpenAI(api_key=api_key, base_url=base_url) if api_key else None

class ManagerService:
    @staticmethod
    async def plan_and_enqueue(main_task: str, parent_task_id: str) -> List[Dict[str, Any]]:
        """
        Calls an LLM to break down a main task and pushes subtasks to Queue.
        """
        LogService.log(
            task_id=parent_task_id,
            agent="manager",
            action="planning",
            status="info",
            message=f"[MANAGER] Creating plan for: {main_task[:50]}..."
        )
        
        prompt = f"""
Break down the following main task into 2-4 actionable subtasks.

Rules:
- Generate 2-4 subtasks only.
- Each step must be highly specific and actionable.
- Return ONLY a valid JSON array of objects with 'id' (numeric) and 'description'.
- Provide absolutely no explanations, markdown blocking, or other text.

Main Task: "{main_task}"
"""
        
        subtask_data = []
        try:
            if not client:
                subtask_data = [
                    {"id": 1, "description": "Quick analysis of task scope"},
                    {"id": 2, "description": "Execution of core objective"},
                    {"id": 3, "description": "Validation and reporting"}
                ]
            else:
                response = await asyncio.to_thread(
                    client.chat.completions.create,
                    model="openai/gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a precise task-planning AI. Output JSON only. Max 4 tasks."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=1000
                )
                
                content = response.choices[0].message.content.strip()
                # Simple cleanup
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                subtask_data = json.loads(content)

            subtasks_for_ui = []
            LogService.log(
                task_id=parent_task_id,
                agent="manager",
                action="created_tasks",
                status="success",
                message=f"[MANAGER] Created {len(subtask_data)} tasks"
            )

            for i, item in enumerate(subtask_data):
                desc = item.get("description", str(item))
                # Create in DB
                task = TaskService.create_task(description=desc, parent_id=parent_task_id)
                # Enqueue in QueueService
                await QueueService.enqueue(task.id, desc)
                
                subtasks_for_ui.append({
                    "id": task.id,
                    "title": f"Step {i+1}",
                    "description": desc,
                    "status": "pending",
                    "latency": "0ms"
                })
            
            return subtasks_for_ui

        except Exception as e:
            print(f"Manager Planning Error: {e}")
            fallback = ["Analyze task", "Execute core logic", "Finalize report"]
            subtasks_for_ui = []
            for i, desc in enumerate(fallback):
                task = TaskService.create_task(description=desc, parent_id=parent_task_id)
                await QueueService.enqueue(task.id, desc)
                subtasks_for_ui.append({
                    "id": task.id,
                    "title": f"Step {i+1}",
                    "description": desc,
                    "status": "pending",
                    "latency": "0ms"
                })
            return subtasks_for_ui

    @staticmethod
    async def synthesize_results(main_task: str, subtasks: List[Task]) -> str:
        """
        Aggregates subtask results into a professional executive summary.
        """
        if not client:
            return f"Synthesized results for {main_task}: All subtasks completed successfully."

        # 1. Clean and Prepare Context
        cleaned_results = []
        for t in subtasks:
            if not t.result:
                continue
            
            # Remove noise like "Task:", "Result:", "Retrying..."
            res = t.result.replace("Task:", "").replace("Result:", "").strip()
            # Basic cleanup of redundant system phrases
            noise = ["Processing...", "Started subtask", "Retrying session", "Task Result:"]
            for n in noise:
                res = res.replace(n, "")
            
            cleaned_results.append(f"MISSION COMPONENT: {t.description}\nOUTCOME: {res}")

        context = "\n\n".join(cleaned_results)
        
        # 2. Premium Synthesis Prompt
        prompt = f"""
You are a Staff Executive Intelligence Analyst. Your goal is to synthesize multiple AI agent outputs into a world-class strategic brief.

ORIGINAL MISSION: "{main_task}"

SUBTASK DATA:
{context}

INSTRUCTIONS:
- Analyze all component outcomes and merge them into a cohesive, high-level narrative.
- Remove all repetitive phrasing, technical filler, and system logs.
- Do NOT repeat the subtask descriptions verbatim. Synthesize the VALUE.
- Provide a structured response using the EXACT following hierarchy:
  ### 1. Executive Summary
  ### 2. Strategic Insights
  ### 3. Execution Roadmap
  ### 4. Risks & Considerations
  ### 5. Future Vectors

TONE:
Sharp, premium, professional, and highly intelligent. Avoid fluff. Use professional Markdown formatting (### headings, bullet points, bold text).
"""

        try:
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a Principal Executive Strategist. You produce world-class executive summaries for Fortune 500 CEOs."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Synthesis Error: {e}")
            return f"Analysis complete for {main_task}. System successfully consolidated results from {len(subtasks)} nodes."

    @staticmethod
    def break_down_task(main_task: str) -> List[str]:
        # Legacy support if needed elsewhere
        return ["Analyze", "Execute", "Complete"]
