import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const shops = await prisma.shop.findMany({
      where: {
        isOpen: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { jobTitle: { contains: search } },
            { owner: { nickname: { contains: search } } }
          ]
        })
      },
      include: {
        owner: { select: { id: true, nickname: true } },
        menuItems: { where: { isAvailable: true } },
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ shops })
  } catch (error) {
    console.error('가게 목록 조회 오류:', error)
    return NextResponse.json({ error: '가게 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { name, jobTitle, description } = await request.json()

    if (!name || name.length > 30) {
      return NextResponse.json({ error: '가게 이름은 1~30자' }, { status: 400 })
    }
    if (!jobTitle || jobTitle.length > 20) {
      return NextResponse.json({ error: '직업은 1~20자' }, { status: 400 })
    }

    const existingShop = await prisma.shop.findUnique({ where: { ownerId: session.user.id } })
    if (existingShop) {
      return NextResponse.json({ error: '이미 가게를 운영 중' }, { status: 400 })
    }

    const shop = await prisma.shop.create({
      data: { ownerId: session.user.id, name, jobTitle, description, isOpen: false },
      include: { owner: { select: { id: true, nickname: true } } }
    })

    return NextResponse.json({ success: true, shop, message: '가게 생성됨!' })
  } catch (error) {
    console.error('가게 생성 오류:', error)
    return NextResponse.json({ error: '가게 생성 실패' }, { status: 500 })
  }
}
