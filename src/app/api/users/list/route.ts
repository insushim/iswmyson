import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const users = await prisma.user.findMany({
      select: { id: true, nickname: true },
      orderBy: { nickname: 'asc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
