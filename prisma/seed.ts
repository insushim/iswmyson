import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 재판관 계정 생성 - 심현보
  const judgePassword = await bcrypt.hash('7979', 10)
  const judge = await prisma.user.upsert({
    where: { nickname: '심현보' },
    update: {},
    create: {
      nickname: '심현보',
      password: judgePassword,
      marks: 10000,
      isJudge: true
    }
  })
  console.log('✅ 재판관 계정 생성: 심현보')

  // 재판관 가게 생성
  const judgeShop = await prisma.shop.upsert({
    where: { ownerId: judge.id },
    update: {},
    create: {
      name: '심현보 법률사무소',
      jobTitle: '재판관',
      description: '공정한 재판을 약속드립니다. 상담 환영!',
      isOpen: true,
      ownerId: judge.id
    }
  })

  // 기존 메뉴가 없으면 생성
  const existingMenus = await prisma.menuItem.count({ where: { shopId: judgeShop.id } })
  if (existingMenus === 0) {
    await prisma.menuItem.createMany({
      data: [
        { shopId: judgeShop.id, name: '법률 상담', description: '분쟁 해결 상담', basePrice: 100 },
        { shopId: judgeShop.id, name: '계약서 검토', description: '계약서 검토 서비스', basePrice: 200 },
        { shopId: judgeShop.id, name: 'VIP 상담', description: 'VIP 맞춤 상담', basePrice: 500 }
      ]
    })
    console.log('✅ 재판관 가게 메뉴 생성')
  }

  console.log('')
  console.log('🎉 시드 데이터 생성 완료!')
  console.log('')
  console.log('📋 계정 정보:')
  console.log('   재판관: 심현보 / 비밀번호: 7979')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
