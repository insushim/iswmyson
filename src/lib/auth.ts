import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        nickname: { label: '닉네임', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.password) {
          throw new Error('닉네임과 비밀번호를 입력해주세요')
        }

        const user = await prisma.user.findUnique({
          where: { nickname: credentials.nickname as string }
        })

        if (!user) throw new Error('존재하지 않는 사용자입니다')

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) throw new Error('비밀번호가 일치하지 않습니다')

        return {
          id: user.id,
          nickname: user.nickname,
          marks: user.marks,
          isJudge: user.isJudge,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.nickname = user.nickname
        token.marks = user.marks
        token.isJudge = user.isJudge
      }
      if (trigger === 'update' && session?.marks !== undefined) {
        token.marks = session.marks
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.nickname = token.nickname as string
        session.user.marks = token.marks as number
        session.user.isJudge = token.isJudge as boolean
      }
      return session
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
