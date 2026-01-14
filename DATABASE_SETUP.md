# 마크 모임 - 데이터베이스 설정 가이드

## 방법 1: Vercel Postgres (권장)

1. https://vercel.com/insu-shims-projects/mark-moim 접속
2. 상단 "Storage" 탭 클릭
3. "Create Database" → "Postgres" 선택
4. 데이터베이스 이름 입력 (예: mark-moim-db)
5. "Create" 클릭
6. 환경변수가 자동으로 설정됨

설정 완료 후 터미널에서:
```bash
npx vercel env pull
npx prisma db push
npx tsx prisma/seed.ts
npx vercel --prod
```

## 방법 2: Neon (무료 PostgreSQL)

1. https://neon.tech 접속 → GitHub로 가입
2. "Create a project" 클릭
3. Project name: mark-moim
4. Region: Asia Pacific (Singapore) 선택
5. "Create Project" 클릭
6. Connection string 복사 (postgresql://...로 시작)

터미널에서:
```bash
# DATABASE_URL 환경변수 추가
echo "복사한_CONNECTION_STRING" | npx vercel env add DATABASE_URL production

# 배포
npx vercel --prod
```

## 테스트 계정

앱 배포 후 다음 계정으로 로그인:

| 닉네임 | 비밀번호 | 역할 |
|--------|----------|------|
| 심현보 | 7979 | 재판관 |
| 테스트1 | 1234 | 일반 사용자 |
| 테스트2 | 1234 | 가게 운영자 |
| 테스트3 | 1234 | 일반 사용자 |
| 테스트4 | 1234 | 일반 사용자 |
| 테스트5 | 1234 | 일반 사용자 |

## 재판관 페이지

- URL: /judge
- 비밀번호: 7979
- 힌트: 현보의 금고 번호
