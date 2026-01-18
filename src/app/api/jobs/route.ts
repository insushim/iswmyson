import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    const jobs = await prisma.job.findMany({
      orderBy: { name: 'asc' }
    })

    let myShopJobs: string[] = []
    if (session?.user?.id) {
      const myShops = await prisma.shop.findMany({
        where: { ownerId: session.user.id },
        select: { jobTitle: true }
      })
      myShopJobs = [...new Set(myShops.map(s => s.jobTitle))]
    }

    return NextResponse.json({ jobs, myShopJobs })
  } catch (error) {
    console.error('직업 목록 조회 오류:', error)
    return NextResponse.json({ error: '직업 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: '직업 이름을 입력해주세요' }, { status: 400 })
    }

    // 중복 확인
    const existing = await prisma.job.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 직업입니다' }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('직업 추가 오류:', error)
    return NextResponse.json({ error: '직업 추가 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: '직업 ID 필요' }, { status: 400 })
    }

    await prisma.job.delete({ where: { id: jobId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('직업 삭제 오류:', error)
    return NextResponse.json({ error: '직업 삭제 실패' }, { status: 500 })
  }
}
