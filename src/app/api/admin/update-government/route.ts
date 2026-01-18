import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.isJudge) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 기존 정부 마크를 400으로 업데이트
    const government = await prisma.government.findFirst()
    if (government) {
      await prisma.government.update({
        where: { id: government.id },
        data: { marks: 400 }
      })
    } else {
      await prisma.government.create({ data: { marks: 400 } })
    }

    return NextResponse.json({
      success: true,
      message: '정부 마크가 400으로 업데이트되었습니다'
    })
  } catch (error) {
    console.error('정부 마크 업데이트 오류:', error)
    return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
  }
}
