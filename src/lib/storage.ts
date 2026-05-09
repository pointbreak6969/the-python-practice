import type { QuestionStatus } from './types'

type LastSession = {
  questionId: string
  tier: string
  timestamp: number
}

function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function getQuestionStatus(id: string): QuestionStatus {
  if (!isClient()) return 'not_started'
  return (localStorage.getItem(`qstatus:${id}`) as QuestionStatus) ?? 'not_started'
}

export function setQuestionStatus(id: string, status: QuestionStatus): void {
  if (!isClient()) return
  if (getQuestionStatus(id) === 'solved') return
  localStorage.setItem(`qstatus:${id}`, status)
}

export function getAllStatuses(): Record<string, QuestionStatus> {
  if (!isClient()) return {}
  const result: Record<string, QuestionStatus> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('qstatus:')) {
      const id = key.slice('qstatus:'.length)
      result[id] = (localStorage.getItem(key) as QuestionStatus) ?? 'not_started'
    }
  }
  return result
}

export function getAttemptCount(id: string): number {
  if (!isClient()) return 0
  return parseInt(localStorage.getItem(`qattempts:${id}`) ?? '0', 10)
}

export function setAttemptCount(id: string, count: number): void {
  if (!isClient()) return
  localStorage.setItem(`qattempts:${id}`, String(count))
}

export function getAllAttemptCounts(): Record<string, number> {
  if (!isClient()) return {}
  const result: Record<string, number> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('qattempts:')) {
      const id = key.slice('qattempts:'.length)
      result[id] = parseInt(localStorage.getItem(key) ?? '0', 10)
    }
  }
  return result
}

export function getSavedCode(id: string): string | null {
  if (!isClient()) return null
  return localStorage.getItem(`qcode:${id}`)
}

export function setSavedCode(id: string, code: string): void {
  if (!isClient()) return
  localStorage.setItem(`qcode:${id}`, code)
}

export function getLastSession(): LastSession | null {
  if (!isClient()) return null
  const raw = localStorage.getItem('session:last')
  if (!raw) return null
  try {
    return JSON.parse(raw) as LastSession
  } catch {
    return null
  }
}

export function setLastSession(questionId: string, tier: string): void {
  if (!isClient()) return
  localStorage.setItem(
    'session:last',
    JSON.stringify({ questionId, tier, timestamp: Date.now() })
  )
}
