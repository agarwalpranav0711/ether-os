import { NextResponse } from 'next/server'
import { db } from '../../../db'
import { sessions, executionLogs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = body.prompt || body.task

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    // Call real FastAPI backend streaming endpoint
    // We assume the FastAPI endpoint is /stream, fallback to /run if not provided
    const response = await fetch(`${backendUrl}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: prompt })
    })

    if (!response.ok) {
        throw new Error(`FastAPI Backend error: ${response.status} ${response.statusText}`)
    }

    // Create a new session ID for postgres tracking
    const sessionId = Math.random().toString(36).substring(2, 12);
    try {
      if (process.env.DATABASE_URL) {
          await db.insert(sessions).values({ id: sessionId, prompt });
      } else {
          console.warn("Neon DATABASE_URL is not set, skipping session save");
      }
    } catch (e) {
      console.error("DB Session Save Error", e);
    }

    const { readable, writable } = new TransformStream();
    const decoder = new TextDecoder();
    
    // Pipe the response body to our logic in the background
    response.body!.pipeThrough(new TransformStream({
      async transform(chunk, controller) {
         // Pass the raw chunk to the client immediately
         controller.enqueue(chunk);
         
         if (!process.env.DATABASE_URL) return;

         try {
           const chunkStr = decoder.decode(chunk, { stream: true });
           const lines = chunkStr.split('\\n\\n');
           
           for (const line of lines) {
             const trimmed = line.trim();
             if (trimmed.startsWith('data: ')) {
                const parsed = JSON.parse(trimmed.slice(6));
                
                if (parsed.type === 'plan') {
                     (async () => {
                       try {
                         await db.update(sessions).set({ plan: parsed.data }).where(eq(sessions.id, sessionId));
                       } catch (e) { console.error("DB Update Plan Error", e); }
                     })();
                 } else if (parsed.type === 'log') {
                     (async () => {
                       try {
                         const logId = Math.random().toString(36).substring(2, 12);
                         const statusVal = parsed.data.toLowerCase().includes('error') ? 'error' : 'ok';
                         await db.insert(executionLogs).values({
                             id: logId,
                             sessionId: sessionId,
                             text: parsed.data,
                             status: statusVal,
                             time: new Date().toISOString()
                         });
                       } catch (e) { console.error("DB Insert Log Error", e); }
                     })();
                 } else if (parsed.type === 'result') {
                     (async () => {
                       try {
                         await db.update(sessions).set({ result: parsed.data }).where(eq(sessions.id, sessionId));
                       } catch (e) { console.error("DB Update Result Error", e); }
                     })();
                 }
             }
           }
         } catch (e) {
             // Silently fail if DB write errors or parsing errors to not break streaming
             console.error("DB Async Insert Error:", e);
         }
      }
    })).pipeTo(writable).catch(err => {
        console.error("Stream pipe error:", err);
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
  } catch (err: any) {
    console.error('Proxy Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
