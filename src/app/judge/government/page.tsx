"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { MarkDisplay } from "@/components/common/MarkDisplay";
import {
  Landmark,
  ShoppingCart,
  BookOpen,
  Store,
  ArrowLeft,
  Search,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Government {
  id: string;
  marks: number;
}

interface GovernmentOrder {
  id: string;
  shopName: string;
  ownerNickname: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
  jobTitle: string;
  description: string | null;
  isOpen: boolean;
  owner: { nickname: string };
}

export default function GovernmentPage() {
  const router = useRouter();
  const [government, setGovernment] = useState<Government | null>(null);
  const [orders, setOrders] = useState<GovernmentOrder[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transfer");

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [orderForm, setOrderForm] = useState({ description: "", amount: "" });
  const [isOrdering, setIsOrdering] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [users, setUsers] = useState<{ id: string; nickname: string }[]>([]);
  const [transferForm, setTransferForm] = useState({
    receiverId: "",
    description: "",
    amount: "",
  });
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    fetchGovernment();
    fetchShops();
    fetchUsers();
  }, []);

  const fetchGovernment = async () => {
    try {
      const response = await fetch("/api/government");
      if (response.ok) {
        const data = await response.json();
        setGovernment(data.government);
        setOrders(data.orders || []);
      } else if (response.status === 403) {
        toast.error("권한이 없습니다");
        router.push("/judge");
      }
    } catch (error) {
      console.error("Failed to fetch government:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops");
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error("Failed to fetch shops:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/list");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.receiverId) {
      toast.error("받는 사람을 선택해주세요");
      return;
    }
    if (!transferForm.description.trim()) {
      toast.error("송금 사유를 입력해주세요");
      return;
    }
    if (!transferForm.amount || parseInt(transferForm.amount) <= 0) {
      toast.error("금액을 입력해주세요");
      return;
    }

    setIsTransferring(true);
    try {
      const response = await fetch("/api/government/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: transferForm.receiverId,
          description: transferForm.description,
          amount: parseInt(transferForm.amount),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "송금 실패");
      }

      toast.success("개인 송금이 완료되었습니다!");
      setTransferForm({ receiverId: "", description: "", amount: "" });
      setActiveTab("ledger");
      fetchGovernment();
    } catch (error) {
      const message = error instanceof Error ? error.message : "송금 실패";
      toast.error(message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedShop) return;
    if (!orderForm.description.trim()) {
      toast.error("주문 내용을 입력해주세요");
      return;
    }
    if (!orderForm.amount || parseInt(orderForm.amount) <= 0) {
      toast.error("금액을 입력해주세요");
      return;
    }

    setIsOrdering(true);
    try {
      const response = await fetch("/api/government", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: selectedShop.id,
          description: orderForm.description,
          amount: parseInt(orderForm.amount),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "주문 실패");
      }

      toast.success("정부 주문이 완료되었습니다!");
      setOrderForm({ description: "", amount: "" });
      setSelectedShop(null);
      setActiveTab("ledger");
      fetchGovernment();
    } catch (error) {
      const message = error instanceof Error ? error.message : "주문 실패";
      toast.error(message);
    } finally {
      setIsOrdering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/judge/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          대시보드로
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Landmark className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정부</h1>
            <p className="text-gray-600">정부 예산 관리 및 주문</p>
          </div>
        </div>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4 px-6">
            <p className="text-sm text-blue-600 font-medium">정부 예산</p>
            <MarkDisplay amount={government?.marks || 0} size="lg" />
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transfer">
            <Send className="mr-2 h-4 w-4" />
            개인 송금
          </TabsTrigger>
          <TabsTrigger value="order">
            <ShoppingCart className="mr-2 h-4 w-4" />
            주문하기
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <BookOpen className="mr-2 h-4 w-4" />
            장부
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                개인에게 송금
              </CardTitle>
              <CardDescription>
                정부 예산에서 개인에게 직접 마크를 지급합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  받는 사람
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={transferForm.receiverId}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      receiverId: e.target.value,
                    })
                  }
                >
                  <option value="">선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nickname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  송금 사유
                </label>
                <Textarea
                  value={transferForm.description}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="예: 환경미화 보상금, 우수 시민상 등"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  금액 (마크)
                </label>
                <Input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="지급할 금액"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleTransfer}
                disabled={isTransferring}
              >
                {isTransferring ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                송금하기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order" className="space-y-4">
          {selectedShop ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedShop.name}</CardTitle>
                    <CardDescription>
                      {selectedShop.owner.nickname} | {selectedShop.jobTitle}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedShop(null)}
                  >
                    다른 가게 선택
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    주문 내용 (이유)
                  </label>
                  <Textarea
                    value={orderForm.description}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="예: 시청 행사용 케이터링 주문"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    금액 (마크)
                  </label>
                  <Input
                    type="number"
                    value={orderForm.amount}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, amount: e.target.value })
                    }
                    placeholder="지급할 금액"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleOrder}
                  disabled={isOrdering}
                >
                  {isOrdering ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Landmark className="mr-2 h-4 w-4" />
                  )}
                  정부 주문 확정
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="가게 이름, 사장님, 직업으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredShops.map((shop) => (
                  <Card
                    key={shop.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedShop(shop)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Store className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">{shop.name}</h3>
                            <Badge
                              variant={shop.isOpen ? "default" : "secondary"}
                            >
                              {shop.isOpen ? "영업중" : "휴업"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {shop.owner.nickname} | {shop.jobTitle}
                          </p>
                          {shop.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {shop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filteredShops.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>검색 결과가 없습니다</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>정부 지출 장부</CardTitle>
              <CardDescription>정부가 지급한 모든 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>아직 지출 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Card key={order.id} className="bg-gray-50">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {order.shopName}
                              </span>
                              <span className="text-gray-500">
                                ({order.ownerNickname})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {order.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <MarkDisplay
                            amount={order.amount}
                            className="text-red-600"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
