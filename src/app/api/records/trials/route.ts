import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const trials = await prisma.trial.findMany({
      include: {
        report: {
          select: { reason: true }
        },
        defendant: { select: { id: true, nickname: true } },
        plaintiff: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ trials })
  } catch (error) {
    console.error('재판 기록 조회 오류:', error)
    return NextResponse.json({ error: '재판 기록 조회 실패' }, { status: 500 })
  }
}
