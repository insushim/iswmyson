import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Coins, Store, Scale, Users, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Coins className="h-8 w-8 text-amber-500" />
          <span className="text-2xl font-bold text-gray-800">마크 모임</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="outline">로그인</Button></Link>
          <Link href="/register"><Button>가입하기</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            마크로 시작하는<br />
            <span className="text-amber-500">새로운 경제 커뮤니티</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            가상 화폐 마크를 사용해 가게를 운영하고,
            거래하고, 공정한 재판 시스템으로 분쟁을 해결하세요.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              지금 시작하기<ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-amber-300 transition-colors">
            <CardHeader>
              <Coins className="h-12 w-12 text-amber-500 mb-2" />
              <CardTitle>마크 화폐</CardTitle>
              <CardDescription>가입 시 100 마크 지급!<br />거래와 가게 운영에 사용</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <Store className="h-12 w-12 text-blue-500 mb-2" />
              <CardTitle>나만의 가게</CardTitle>
              <CardDescription>원하는 직업을 선택하고<br />자유롭게 메뉴판을 만드세요</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-green-300 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 text-green-500 mb-2" />
              <CardTitle>자유로운 거래</CardTitle>
              <CardDescription>원하는 내용으로 주문하고<br />1:1 거래도 가능해요</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <Scale className="h-12 w-12 text-purple-500 mb-2" />
              <CardTitle>공정한 재판</CardTitle>
              <CardDescription>문제가 생기면 신고하세요<br />재판관이 공정하게 판결합니다</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">이용 방법</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">닉네임 정하기</h3>
              <p className="text-gray-600 text-sm">원하는 닉네임으로 가입<br />(한번 정하면 변경 불가!)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">가게 열기</h3>
              <p className="text-gray-600 text-sm">시장에서 직업을 선택하고<br />메뉴판을 만들어보세요</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">거래 시작</h3>
              <p className="text-gray-600 text-sm">다른 가게에 주문하거나<br />1:1 거래를 해보세요!</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>마크 모임. 모든 권리 보유.</p>
      </footer>
    </div>
  )
}
