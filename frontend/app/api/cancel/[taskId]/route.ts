import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const taskId = params.taskId
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${backendUrl}/cancel/${taskId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to cancel task' }, { status: response.status })
    }

    return NextResponse.json({ message: 'Task cancelled' })
  } catch (error) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 })
  }
}
