import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        sender: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('거래 기록 조회 오류:', error)
    return NextResponse.json({ error: '거래 기록 조회 실패' }, { status: 500 })
  }
}
