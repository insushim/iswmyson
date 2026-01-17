import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { shopId } = await params
    const { name, description, basePrice, estimatedTime } = await request.json()

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    if (shop.ownerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const menuItem = await prisma.menuItem.create({
      data: { shopId, name, description, basePrice: basePrice || null, estimatedTime: estimatedTime || null }
    })

    return NextResponse.json({ success: true, menuItem })
  } catch (error) {
    console.error('메뉴 추가 오류:', error)
    return NextResponse.json({ error: '메뉴 추가 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { shopId } = await params
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) return NextResponse.json({ error: '메뉴 ID 필요' }, { status: 400 })

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    if (shop.ownerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    await prisma.menuItem.delete({ where: { id: menuItemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('메뉴 삭제 오류:', error)
    return NextResponse.json({ error: '메뉴 삭제 실패' }, { status: 500 })
  }
}
