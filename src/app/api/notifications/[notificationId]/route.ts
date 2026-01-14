import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { notificationId } = await params
    const { isRead } = await request.json()

    const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
    if (!notification) return NextResponse.json({ error: '존재하지 않는 알림' }, { status: 404 })
    if (notification.userId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead }
    })

    return NextResponse.json({ success: true, notification: updated })
  } catch (error) {
    console.error('알림 수정 오류:', error)
    return NextResponse.json({ error: '알림 수정 실패' }, { status: 500 })
  }
}
