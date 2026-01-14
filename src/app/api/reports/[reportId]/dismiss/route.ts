import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.isJudge) {
      return NextResponse.json({ error: '재판관만 가능합니다' }, { status: 403 })
    }

    const { reportId } = await params

    const report = await prisma.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: '신고를 찾을 수 없습니다' }, { status: 404 })
    }

    if (report.status !== 'PENDING') {
      return NextResponse.json({ error: '이미 처리된 신고입니다' }, { status: 400 })
    }

    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' }
    })

    return NextResponse.json({ message: '신고가 기각되었습니다' })
  } catch (error) {
    console.error('Failed to dismiss report:', error)
    return NextResponse.json({ error: '기각 처리 실패' }, { status: 500 })
  }
}
