import { prisma } from '@/lib/prisma'
import { QuestionsClient, type AdminQuestion } from './QuestionsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Questions — PyPractice Admin' }

export default async function AdminQuestionsPage() {
  const [py, js, sq, attemptsByQuestion, correctByQuestion] = await Promise.all([
    prisma.questions.findMany({ orderBy: { id: 'asc' } }),
    prisma.javascript_questions.findMany({ orderBy: { id: 'asc' } }),
    prisma.sql_questions.findMany({ orderBy: { id: 'asc' } }),
    prisma.attempt.groupBy({ by: ['questionId'], _count: { _all: true } }),
    prisma.attempt.groupBy({
      by: ['questionId'],
      where: { correct: true },
      _count: { _all: true },
    }),
  ])

  const attemptsMap = new Map(attemptsByQuestion.map((g) => [g.questionId, g._count._all]))
  const correctMap = new Map(correctByQuestion.map((g) => [g.questionId, g._count._all]))

  const toRow = (q: (typeof py)[number] | (typeof js)[number], language: string): AdminQuestion => {
    const attempts = attemptsMap.get(q.id) ?? 0
    const correct = correctMap.get(q.id) ?? 0
    return {
      id: q.id,
      language,
      tier: q.tier,
      topic: q.topic,
      type: q.type,
      question: q.question,
      answer: q.answer,
      alternative_answer: q.alternative_answer,
      explanation: q.explanation,
      expected_output: q.expected_output,
      attempts,
      solveRate: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
    }
  }

  const questions: AdminQuestion[] = [
    ...py.map((q) => toRow(q, 'python')),
    ...js.map((q) => toRow(q, 'javascript')),
    ...sq.map((q) => toRow(q, 'sql')),
  ]

  return <QuestionsClient questions={questions} />
}
