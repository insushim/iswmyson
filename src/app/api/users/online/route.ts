import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 온라인 기준: 30초 이내에 활동한 사용자
const ONLINE_THRESHOLD_MS = 30 * 1000

// GET: 온라인 사용자 목록 조회 (자기 제외)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const thresholdTime = new Date(Date.now() - ONLINE_THRESHOLD_MS)

    // 자기 자신을 제외한 온라인 사용자 조회
    const onlineUsers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        lastActive: { gte: thresholdTime }
      },
      select: {
        id: true,
        nickname: true
      },
      orderBy: {
        lastActive: 'desc'
      }
    })

    return NextResponse.json({ onlineUsers })
  } catch (error) {
    console.error('온라인 사용자 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 하트비트 (온라인 상태 갱신)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // lastActive 갱신
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActive: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('하트비트 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
