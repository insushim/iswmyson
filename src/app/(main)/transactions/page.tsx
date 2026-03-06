"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { MarkDisplay } from "@/components/common/MarkDisplay";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Check,
  X,
  AlertTriangle,
  Coins,
} from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  nickname: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  hasObjection: boolean;
  objectionReason: string | null;
  objectionStatus: string | null;
  sender: { id: string; nickname: string };
  receiver: { id: string; nickname: string };
  createdAt: string;
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [processingTxId, setProcessingTxId] = useState<string | null>(null);

  const [sendForm, setSendForm] = useState({
    receiverId: "",
    amount: "",
    description: "",
  });

  const [objectionForm, setObjectionForm] = useState({
    transactionId: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, usersRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/users/list"),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(
          (usersData.users || []).filter(
            (u: User) => u.id !== session?.user?.id,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendForm.receiverId) {
      toast.error("받는 사람을 선택해주세요");
      return;
    }
    if (!sendForm.amount || parseInt(sendForm.amount) <= 0) {
      toast.error("금액을 입력해주세요");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: sendForm.receiverId,
          amount: parseInt(sendForm.amount),
          description: sendForm.description || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "송금 실패");
      }

      toast.success("송금 요청을 보냈습니다!");
      setSendForm({ receiverId: "", amount: "", description: "" });
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "송금 실패";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async (transactionId: string) => {
    if (processingTxId) return;
    setProcessingTxId(transactionId);
    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/accept`,
        {
          method: "POST",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "수락 실패");
      }

      toast.success("거래를 수락했습니다!");
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "수락 실패";
      toast.error(message);
    } finally {
      setProcessingTxId(null);
    }
  };

  const handleReject = async (transactionId: string) => {
    if (processingTxId) return;
    setProcessingTxId(transactionId);
    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/reject`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast.success("거래를 거절했습니다");
        fetchData();
      }
    } catch (error) {
      toast.error("거절 실패");
    } finally {
      setProcessingTxId(null);
    }
  };

  const handleObjection = async () => {
    if (!objectionForm.reason.trim()) {
      toast.error("이의 제기 사유를 입력해주세요");
      return;
    }

    try {
      const response = await fetch(
        `/api/transactions/${objectionForm.transactionId}/objection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: objectionForm.reason }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "이의 제기 실패");
      }

      toast.success("이의를 제기했습니다. 재판관이 검토합니다.");
      setObjectionForm({ transactionId: "", reason: "" });
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "이의 제기 실패";
      toast.error(message);
    }
  };

  const myId = session?.user?.id;
  const pendingReceived = transactions.filter(
    (t) => t.receiver.id === myId && t.status === "PENDING",
  );
  const pendingSent = transactions.filter(
    (t) => t.sender.id === myId && t.status === "PENDING",
  );
  const completedTx = transactions.filter(
    (t) => t.status === "COMPLETED" || t.status === "ACCEPTED",
  );
  const rejectedTx = transactions.filter((t) => t.status === "REJECTED");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">1:1 거래</h1>
        <p className="text-gray-600">다른 사용자와 마크를 주고받으세요</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              송금하기
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                받는 사람
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={sendForm.receiverId}
                onChange={(e) =>
                  setSendForm({ ...sendForm, receiverId: e.target.value })
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
                금액 (마크)
              </label>
              <Input
                type="number"
                value={sendForm.amount}
                onChange={(e) =>
                  setSendForm({ ...sendForm, amount: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                메모 (선택)
              </label>
              <Textarea
                value={sendForm.description}
                onChange={(e) =>
                  setSendForm({ ...sendForm, description: e.target.value })
                }
                placeholder="거래 내용을 입력하세요"
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Coins className="mr-2 h-4 w-4" />
              )}
              송금 요청
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {pendingReceived.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5" />
                  받은 거래 요청 ({pendingReceived.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingReceived.map((tx) => (
                  <Card key={tx.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">
                            {tx.sender.nickname}님이 보냄
                          </p>
                          {tx.description && (
                            <p className="text-sm text-gray-600">
                              {tx.description}
                            </p>
                          )}
                        </div>
                        <MarkDisplay amount={tx.amount} size="lg" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          variant="success"
                          onClick={() => handleAccept(tx.id)}
                          disabled={processingTxId === tx.id}
                        >
                          {processingTxId === tx.id ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          수락
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(tx.id)}
                          disabled={processingTxId === tx.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          거절
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingSent.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" />
                  보낸 거래 요청 ({pendingSent.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingSent.map((tx) => (
                  <Card key={tx.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {tx.receiver.nickname}님에게
                          </p>
                          {tx.description && (
                            <p className="text-sm text-gray-600">
                              {tx.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <MarkDisplay amount={tx.amount} size="lg" />
                          <p className="text-xs text-gray-500 mt-1">대기중</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="completed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="completed">완료된 거래</TabsTrigger>
              <TabsTrigger value="rejected">거절된 거래</TabsTrigger>
            </TabsList>

            <TabsContent value="completed">
              {completedTx.length > 0 ? (
                <div className="space-y-3">
                  {completedTx.map((tx) => {
                    const isSender = tx.sender.id === myId;
                    const canObject = !isSender && !tx.hasObjection;

                    return (
                      <Card key={tx.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isSender ? (
                                <ArrowUpRight className="h-5 w-5 text-red-500" />
                              ) : (
                                <ArrowDownLeft className="h-5 w-5 text-green-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {isSender
                                    ? `${tx.receiver.nickname}님에게 보냄`
                                    : `${tx.sender.nickname}님이 보냄`}
                                </p>
                                {tx.description && (
                                  <p className="text-sm text-gray-600">
                                    {tx.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {new Date(tx.createdAt).toLocaleString(
                                    "ko-KR",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <MarkDisplay
                                amount={tx.amount}
                                size="lg"
                                className={
                                  isSender ? "text-red-500" : "text-green-500"
                                }
                              />
                              {tx.hasObjection && (
                                <Badge variant="objection" className="mt-1">
                                  이의 제기됨
                                </Badge>
                              )}
                            </div>
                          </div>

                          {canObject &&
                            objectionForm.transactionId !== tx.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 text-green-600 border-green-600"
                                onClick={() =>
                                  setObjectionForm({
                                    transactionId: tx.id,
                                    reason: "",
                                  })
                                }
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                이의 제기
                              </Button>
                            )}

                          {objectionForm.transactionId === tx.id && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg space-y-2">
                              <Textarea
                                value={objectionForm.reason}
                                onChange={(e) =>
                                  setObjectionForm({
                                    ...objectionForm,
                                    reason: e.target.value,
                                  })
                                }
                                placeholder="이의 제기 사유를 입력해주세요"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={handleObjection}
                                >
                                  제출
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setObjectionForm({
                                      transactionId: "",
                                      reason: "",
                                    })
                                  }
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Coins className="h-12 w-12 text-gray-400" />}
                  title="완료된 거래가 없습니다"
                  description=""
                />
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejectedTx.length > 0 ? (
                <div className="space-y-3">
                  {rejectedTx.map((tx) => {
                    const isSender = tx.sender.id === myId;
                    return (
                      <Card key={tx.id} className="opacity-75">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {isSender
                                  ? `${tx.receiver.nickname}님에게`
                                  : `${tx.sender.nickname}님이`}
                              </p>
                              {tx.description && (
                                <p className="text-sm text-gray-600">
                                  {tx.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <MarkDisplay amount={tx.amount} />
                              <Badge variant="secondary" className="mt-1">
                                거절됨
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<X className="h-12 w-12 text-gray-400" />}
                  title="거절된 거래가 없습니다"
                  description=""
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
