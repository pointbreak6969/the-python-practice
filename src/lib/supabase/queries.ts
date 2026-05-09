import { getClient } from './client'
import type { Question } from '../types'

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await getClient()
    .from('questions')
    .select('id, tier, topic, type, question, answer, alternative_answer, explanation, created_at')
    .order('tier', { ascending: false })
    .order('id', { ascending: true })

  if (error) throw error
  return data as Question[]
}
