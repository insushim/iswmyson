import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json()

    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json({ error: '닉네임은 2~20자' }, { status: 400 })
    }
    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
      return NextResponse.json({ error: '한글, 영문, 숫자만 사용' }, { status: 400 })
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: '비밀번호는 4자 이상' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { nickname } })
    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 닉네임' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        nickname,
        password: hashedPassword,
        marks: 1000,
        isJudge: nickname === '심현보'
      },
      select: { id: true, nickname: true, marks: true, isJudge: true, createdAt: true }
    })

    return NextResponse.json({ success: true, user, message: '가입 완료! 1,000 마크 지급!' })
  } catch (error) {
    console.error('사용자 등록 오류:', error)
    return NextResponse.json({ error: '등록 중 오류 발생' }, { status: 500 })
  }
}
