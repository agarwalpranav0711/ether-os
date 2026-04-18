import { NextResponse } from 'next/server'
import { db } from '../../../db'
import { sessions, executionLogs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = body.prompt || body.task

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!
    const BASE_URL = backendUrl

    // Call real FastAPI backend streaming endpoint
    const response = await fetch(`${BASE_URL}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: prompt })
    })

    if (!response.ok) {
      throw new Error(`FastAPI Backend error: ${response.status} ${response.statusText}`)
    }

    return new Response(response.body, {
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
