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

    // 1. 모든 유저 마크를 100으로 리셋 (심현보 제외)
    await prisma.user.updateMany({
      where: { isJudge: false },
      data: { marks: 100 }
    })

    // 2. 심현보는 10000 마크 유지
    await prisma.user.updateMany({
      where: { isJudge: true },
      data: { marks: 10000 }
    })

    // 3. 정부 마크를 400으로 리셋
    const government = await prisma.government.findFirst()
    if (government) {
      await prisma.government.update({
        where: { id: government.id },
        data: { marks: 400 }
      })
    } else {
      await prisma.government.create({ data: { marks: 400 } })
    }

    // 4. PRICE_PROPOSED 상태의 주문을 PROPOSED로 변경
    await prisma.order.updateMany({
      where: { status: 'PRICE_PROPOSED' },
      data: { status: 'PROPOSED' }
    })

    return NextResponse.json({
      success: true,
      message: '모든 유저 100마크, 정부 400마크로 리셋 완료'
    })
  } catch (error) {
    console.error('리셋 오류:', error)
    return NextResponse.json({ error: '리셋 실패' }, { status: 500 })
  }
}
