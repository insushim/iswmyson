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

  // 테스트 사용자들 생성
  const testPassword = await bcrypt.hash('1234', 10)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { nickname: '치킨마스터' },
      update: {},
      create: { nickname: '치킨마스터', password: testPassword, marks: 5000 }
    }),
    prisma.user.upsert({
      where: { nickname: '커피왕' },
      update: {},
      create: { nickname: '커피왕', password: testPassword, marks: 3000 }
    }),
    prisma.user.upsert({
      where: { nickname: '빵순이' },
      update: {},
      create: { nickname: '빵순이', password: testPassword, marks: 4000 }
    }),
    prisma.user.upsert({
      where: { nickname: '떡볶이장인' },
      update: {},
      create: { nickname: '떡볶이장인', password: testPassword, marks: 2500 }
    }),
    prisma.user.upsert({
      where: { nickname: '아이스크림' },
      update: {},
      create: { nickname: '아이스크림', password: testPassword, marks: 3500 }
    })
  ])
  console.log('✅ 테스트 사용자 5명 생성')

  // 가게 생성
  const chickenShop = await prisma.shop.upsert({
    where: { ownerId: users[0].id },
    update: {},
    create: {
      name: '황금치킨',
      jobTitle: '치킨집 사장',
      description: '바삭바삭 황금빛 치킨! 비법 양념으로 맛있게 튀겨드립니다.',
      isOpen: true,
      ownerId: users[0].id
    }
  })

  const cafeShop = await prisma.shop.upsert({
    where: { ownerId: users[1].id },
    update: {},
    create: {
      name: '달콤카페',
      jobTitle: '카페 사장',
      description: '직접 로스팅한 원두로 내린 커피와 수제 디저트!',
      isOpen: true,
      ownerId: users[1].id
    }
  })

  const bakeryShop = await prisma.shop.upsert({
    where: { ownerId: users[2].id },
    update: {},
    create: {
      name: '행복빵집',
      jobTitle: '빵집 사장',
      description: '매일 아침 갓 구운 빵! 달콤한 행복을 전해드려요.',
      isOpen: true,
      ownerId: users[2].id
    }
  })

  const tteokbokkiShop = await prisma.shop.upsert({
    where: { ownerId: users[3].id },
    update: {},
    create: {
      name: '매콤분식',
      jobTitle: '떡볶이집 사장',
      description: '엄마 손맛 그대로! 추억의 떡볶이와 순대.',
      isOpen: false,
      ownerId: users[3].id
    }
  })

  console.log('✅ 가게 4개 생성')

  // 기존 메뉴 삭제 후 새로 생성
  await prisma.menuItem.deleteMany({
    where: {
      shopId: { in: [chickenShop.id, cafeShop.id, bakeryShop.id, tteokbokkiShop.id] }
    }
  })

  // 메뉴 생성
  await prisma.menuItem.createMany({
    data: [
      // 치킨집 메뉴
      { shopId: chickenShop.id, name: '후라이드치킨', description: '바삭한 기본 후라이드', basePrice: 18000 },
      { shopId: chickenShop.id, name: '양념치킨', description: '달콤 매콤 양념치킨', basePrice: 19000 },
      { shopId: chickenShop.id, name: '간장치킨', description: '간장 마늘 소스', basePrice: 19000 },
      { shopId: chickenShop.id, name: '반반치킨', description: '후라이드+양념 반반', basePrice: 20000 },
      { shopId: chickenShop.id, name: '콜라 1.5L', description: '음료', basePrice: 2000 },

      // 카페 메뉴
      { shopId: cafeShop.id, name: '아메리카노', description: '진한 에스프레소', basePrice: 4500 },
      { shopId: cafeShop.id, name: '카페라떼', description: '부드러운 우유와 에스프레소', basePrice: 5000 },
      { shopId: cafeShop.id, name: '바닐라라떼', description: '달콤한 바닐라 시럽', basePrice: 5500 },
      { shopId: cafeShop.id, name: '아이스티', description: '상큼한 복숭아 아이스티', basePrice: 4000 },
      { shopId: cafeShop.id, name: '치즈케이크', description: '수제 치즈케이크', basePrice: 6000 },
      { shopId: cafeShop.id, name: '티라미수', description: '이탈리안 티라미수', basePrice: 6500 },

      // 빵집 메뉴
      { shopId: bakeryShop.id, name: '소보루빵', description: '달콤 바삭 소보루', basePrice: 1500 },
      { shopId: bakeryShop.id, name: '크림빵', description: '부드러운 커스터드 크림', basePrice: 2000 },
      { shopId: bakeryShop.id, name: '식빵', description: '담백한 식빵 한 덩이', basePrice: 3000 },
      { shopId: bakeryShop.id, name: '베이글', description: '쫄깃한 플레인 베이글', basePrice: 2500 },
      { shopId: bakeryShop.id, name: '크루아상', description: '버터향 가득 크루아상', basePrice: 3000 },

      // 떡볶이집 메뉴
      { shopId: tteokbokkiShop.id, name: '떡볶이', description: '매콤달콤 떡볶이', basePrice: 4000 },
      { shopId: tteokbokkiShop.id, name: '순대', description: '당면 순대', basePrice: 4000 },
      { shopId: tteokbokkiShop.id, name: '튀김', description: '모둠 튀김', basePrice: 3500 },
      { shopId: tteokbokkiShop.id, name: '떡순튀 세트', description: '떡볶이+순대+튀김', basePrice: 10000 },
      { shopId: tteokbokkiShop.id, name: '라면 사리', description: '라면 추가', basePrice: 1500 }
    ]
  })
  console.log('✅ 메뉴 21개 생성')

  // 재판관 가게도 생성
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

  await prisma.menuItem.deleteMany({
    where: { shopId: judgeShop.id }
  })

  await prisma.menuItem.createMany({
    data: [
      { shopId: judgeShop.id, name: '법률 상담', description: '분쟁 해결 상담', basePrice: 100 },
      { shopId: judgeShop.id, name: '계약서 검토', description: '계약서 검토 서비스', basePrice: 200 },
      { shopId: judgeShop.id, name: 'VIP 상담', description: 'VIP 맞춤 상담', basePrice: 500 }
    ]
  })
  console.log('✅ 재판관 가게 생성')

  console.log('')
  console.log('🎉 시드 데이터 생성 완료!')
  console.log('')
  console.log('📋 테스트 계정 정보:')
  console.log('   재판관: 심현보 / 비밀번호: 7979')
  console.log('   일반 유저: 치킨마스터, 커피왕, 빵순이, 떡볶이장인, 아이스크림 / 비밀번호: 1234')
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
