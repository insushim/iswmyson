import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 접근 가능' }, { status: 403 })

    const { password } = await request.json()

    if (password !== process.env.JUDGE_PASSWORD) {
      return NextResponse.json({ error: '비밀번호 틀림', hint: '힌트: 현보의 금고 번호' }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: '인증 완료' })
  } catch (error) {
    console.error('재판관 인증 오류:', error)
    return NextResponse.json({ error: '인증 실패' }, { status: 500 })
  }
}
