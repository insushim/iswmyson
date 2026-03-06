import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.isJudge) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const { receiverId, description, amount } = await request.json();

    if (!receiverId || !description || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요" },
        { status: 400 },
      );
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    let government = await prisma.government.findFirst();
    if (!government) {
      government = await prisma.government.create({ data: { marks: 400 } });
    }

    if (government.marks < amount) {
      return NextResponse.json(
        { error: "정부 예산이 부족합니다" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.government.update({
        where: { id: government.id },
        data: { marks: { decrement: amount } },
      }),
      prisma.user.update({
        where: { id: receiverId },
        data: { marks: { increment: amount } },
      }),
      prisma.governmentOrder.create({
        data: {
          governmentId: government.id,
          shopId: "DIRECT_TRANSFER",
          shopName: "개인 송금",
          ownerNickname: receiver.nickname,
          description,
          amount,
        },
      }),
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: "GOVERNMENT",
          title: "정부로부터 입금",
          message: `정부가 ${amount} 마크를 지급했습니다: ${description}`,
          link: "/transactions",
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "개인 송금 완료" });
  } catch (error) {
    console.error("정부 개인 송금 오류:", error);
    return NextResponse.json({ error: "송금 실패" }, { status: 500 });
  }
}
