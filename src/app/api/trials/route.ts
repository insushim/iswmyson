import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const trials = await prisma.trial.findMany({
      include: {
        report: {
          include: {
            reporter: { select: { id: true, nickname: true } },
            reported: { select: { id: true, nickname: true } }
          }
        },
        defendant: { select: { id: true, nickname: true } },
        plaintiff: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ trials })
  } catch (error) {
    console.error('재판 목록 조회 오류:', error)
    return NextResponse.json({ error: '재판 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 가능' }, { status: 403 })

    const { reportId, scheduledAt } = await request.json()

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { reporter: true, reported: true, trial: true }
    })
    if (!report) return NextResponse.json({ error: '존재하지 않는 신고' }, { status: 404 })
    if (report.trial) return NextResponse.json({ error: '이미 재판이 있는 신고' }, { status: 400 })

    const trial = await prisma.trial.create({
      data: {
        reportId,
        defendantId: report.reportedId,
        plaintiffId: report.reporterId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'SCHEDULED'
      },
      include: {
        report: { include: { reporter: { select: { id: true, nickname: true } }, reported: { select: { id: true, nickname: true } } } },
        defendant: { select: { id: true, nickname: true } },
        plaintiff: { select: { id: true, nickname: true } }
      }
    })

    await prisma.report.update({ where: { id: reportId }, data: { status: 'TRIAL_SCHEDULED' } })

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: report.reportedId,
          type: 'TRIAL',
          title: '재판이 예정되었습니다',
          message: `죄목: ${report.reason}\n시간: ${scheduledAt ? new Date(scheduledAt).toLocaleString('ko-KR') : '미정'}`,
          link: '/trial/records'
        }
      }),
      prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: 'TRIAL',
          title: '신고한 재판이 예정됨',
          message: `${report.reported.nickname}님에 대한 재판이 예정됨`,
          link: '/trial/records'
        }
      })
    ])

    return NextResponse.json({ success: true, trial, message: '재판 예정됨!' })
  } catch (error) {
    console.error('재판 생성 오류:', error)
    return NextResponse.json({ error: '재판 생성 실패' }, { status: 500 })
  }
}
