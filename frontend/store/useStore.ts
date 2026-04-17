import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIStage = 'idle' | 'planning' | 'execution' | 'result'

export interface TaskCard {
  id: string
  title: string
  description?: string
  status: string
  latency?: string
}

export interface ExecutionLog {
  id: string
  text: string
  status: 'ok' | 'running' | 'error' | 'info'
  time: string
}

export interface ThinkingLog {
  id: string
  text: string
  status?: 'italic' | 'bold'
}

export interface FinalResult {
  alignment?: string
  title?: string
  primaryVector?: string
  secondaryVector?: string
  confidence?: number
  tokens?: number
  entropy?: number
  [key: string]: any
}

interface AppState {
  userInput: string
  setUserInput: (val: string) => void
  stage: AIStage
  setStage: (stage: AIStage) => void
  taskId: string | null
  setTaskId: (id: string | null) => void
  planTasks: TaskCard[]
  setPlanTasks: (tasks: TaskCard[]) => void
  executionLogs: ExecutionLog[]
  addExecutionLog: (log: ExecutionLog) => void
  clearLogs: () => void
  thinkingLogs: ThinkingLog[]
  finalResult: FinalResult | null
  setFinalResult: (result: FinalResult) => void
  isPaused: boolean
  setIsPaused: (val: boolean) => void
  isStreaming: boolean
  startStream: (prompt: string, router: any) => Promise<void>
  
  // Debug Panel
  rawStreamData: string[]
  connectionStatus: 'idle' | 'connected' | 'streaming' | 'failed'
  
  resetSystem: () => void
  cancelTask: () => Promise<void>
  pauseTask: () => Promise<void>
  resumeTask: () => Promise<void>
  abortController: AbortController | null
  isAborting: boolean
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userInput: '',
      setUserInput: (val) => set({ userInput: val }),
      stage: 'idle',
      setStage: (stage) => set({ stage }),
      taskId: null,
      setTaskId: (id) => set({ taskId: id }),
      planTasks: [],
      setPlanTasks: (tasks) => set({ planTasks: tasks }),
      executionLogs: [],
      addExecutionLog: (log) =>
        set((state) => {
          // Sync planTasks status based on log content
          const updatedPlanTasks = state.planTasks.map(task => {
            if (log.text.includes(`Finished task ${task.id}`)) {
              const matches = log.text.match(/with status (\w+)/)
              const status = matches ? matches[1].toUpperCase() : 'COMPLETED'
              return { ...task, status }
            }
            if (log.text.includes(`Started task ${task.id}`)) {
              return { ...task, status: 'PROCESSING' }
            }
            return task
          })
          const logs = [log, ...state.executionLogs].slice(0, 150)
          return { 
            executionLogs: logs,
            planTasks: updatedPlanTasks
          }
        }),
      clearLogs: () => set({ executionLogs: [] }),
      thinkingLogs: [],
      finalResult: null,
      setFinalResult: (result) => set({ finalResult: result }),
      isPaused: false,
      setIsPaused: (val) => set({ isPaused: val }),
      isStreaming: false,
      isAborting: false,
      abortController: null,
      
      resetSystem: () => {
        const { abortController } = get()
        if (abortController) abortController.abort()
        set({
          stage: 'idle',
          taskId: null,
          planTasks: [],
          executionLogs: [],
          thinkingLogs: [],
          finalResult: null,
          isPaused: false,
          isStreaming: false,
          rawStreamData: [],
          connectionStatus: 'idle',
          abortController: null
        })
      },

      cancelTask: async () => {
        const { taskId } = get()
        if (taskId) {
          set({ isAborting: true })
          try {
            await fetch(`/api/cancel/${taskId}`, { method: 'POST' })
            // We DON'T set isStreaming: false here. 
            // We let the SSE stream return the 'complete' event normally.
          } catch (e) {
            console.error('Cancel failed', e)
          } finally {
            set({ isAborting: false })
          }
        }
      },

      pauseTask: async () => {
        const { taskId } = get()
        if (taskId) {
          try {
            await fetch(`/api/pause/${taskId}`, { method: 'POST' })
            set({ isPaused: true })
          } catch (e) {
            console.error('Pause failed', e)
          }
        }
      },

      resumeTask: async () => {
        const { taskId } = get()
        if (taskId) {
          try {
            await fetch(`/api/resume/${taskId}`, { method: 'POST' })
            set({ isPaused: false })
          } catch (e) {
            console.error('Resume failed', e)
          }
        }
      },

      rawStreamData: [],
      connectionStatus: 'idle',

  startStream: async (prompt: string, router: any) => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }

    const newController = new AbortController()

    set({ 
      isStreaming: true, 
      planTasks: [], 
      executionLogs: [], 
      thinkingLogs: [],
      finalResult: null,
      taskId: null,
      rawStreamData: [],
      connectionStatus: 'connected',
      abortController: newController
    })

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: newController.signal
      })

      if (!response.body) {
         set({ connectionStatus: 'failed' })
         throw new Error('No readable stream')
      }

      set({ connectionStatus: 'streaming' })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
           set({ isStreaming: false, connectionStatus: 'idle' })
           break
        }

        const chunkText = decoder.decode(value, { stream: true })
        buffer += chunkText
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            
            // Debug track
            set((state) => ({ rawStreamData: [line, ...state.rawStreamData].slice(0, 50) }))

            try {
              const parsed = JSON.parse(line.slice(6).trim())
              
              if (parsed.type === 'plan') {
                  const dataArray = Array.isArray(parsed.data) ? parsed.data : [parsed.data]
                  set({ stage: 'planning', planTasks: dataArray })
                  if (parsed.task_id) set({ taskId: parsed.task_id })
                  // Ensure routing
                  if (window.location.pathname !== '/manager') router.push('/manager')
              } 
              else if (parsed.type === 'thinking') {
                  // Fallback support if API sends thinking events
                  const logObj: ThinkingLog = typeof parsed.data === 'string' ? { id: Math.random().toString(), text: parsed.data } : parsed.data
                  set((state) => ({ thinkingLogs: [...state.thinkingLogs, logObj] }))
              }
              else if (parsed.type === 'log') {
                  if (get().stage !== 'execution' && window.location.pathname !== '/execution') {
                      set({ stage: 'execution' })
                      router.push('/execution')
                  }
                  
                  const logObj: ExecutionLog = typeof parsed.data === 'string' ? {
                     id: Math.random().toString(36).substring(7),
                     text: parsed.data,
                     status: (parsed.data.toLowerCase().includes('error') || parsed.data.toLowerCase().includes('failed')) ? 'error' : 'ok',
                     time: new Date().toLocaleTimeString()
                  } : parsed.data;

                  get().addExecutionLog(logObj)
              } 
              else if (parsed.type === 'result') {
                  set({ stage: 'result', finalResult: parsed.data })
              }
              else if (parsed.type === 'complete') {
                  set({ isStreaming: false, connectionStatus: 'idle' })
                  if (window.location.pathname !== '/result') router.push('/result')
              }
            } catch (e) {
                console.error('Failed to parse SSE line', line)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error(err)
      set({ isStreaming: false, connectionStatus: 'failed' })
    }
  }
}), { 
    name: 'ether-os-store',
    partialize: (state) => ({
      userInput: state.userInput,
      stage: state.stage,
      taskId: state.taskId,
      planTasks: state.planTasks,
      executionLogs: state.executionLogs,
      thinkingLogs: state.thinkingLogs,
      finalResult: state.finalResult
    })
  }))
