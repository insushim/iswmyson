import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ trialId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 감면 가능' }, { status: 403 })

    const { trialId } = await params

    const trial = await prisma.trial.findUnique({
      where: { id: trialId },
      include: { defendant: true }
    })
    if (!trial) return NextResponse.json({ error: '존재하지 않는 재판' }, { status: 404 })
    if (trial.fineReduced) return NextResponse.json({ error: '이미 감면됨' }, { status: 400 })
    if (trial.status !== 'COMPLETED') return NextResponse.json({ error: '완료된 재판만 감면 가능' }, { status: 400 })

    const reducedAmount = Math.floor(trial.fineAmount! * 0.3)
    const finalFine = trial.fineAmount! - reducedAmount

    await prisma.$transaction([
      prisma.trial.update({
        where: { id: trialId },
        data: { fineReduced: true, finalFine }
      }),
      prisma.user.update({
        where: { id: trial.defendantId },
        data: { marks: { increment: reducedAmount } }
      })
    ])

    const updatedTrial = await prisma.trial.findUnique({ where: { id: trialId } })

    await prisma.notification.create({
      data: {
        userId: trial.defendantId,
        type: 'TRIAL',
        title: '벌금 감면!',
        message: `30% 감면으로 ${reducedAmount.toLocaleString()} 마크 환급`,
        link: '/trial/records'
      }
    })

    return NextResponse.json({ success: true, trial: updatedTrial, reducedAmount, message: `${reducedAmount.toLocaleString()} 마크 환급!` })
  } catch (error) {
    console.error('벌금 감면 오류:', error)
    return NextResponse.json({ error: '벌금 감면 실패' }, { status: 500 })
  }
}
