import { z } from 'zod'

export const registerSchema = z.object({
  nickname: z.string()
    .min(2, '닉네임은 2자 이상')
    .max(20, '닉네임은 20자 이하')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 사용'),
  password: z.string().min(4, '비밀번호는 4자 이상').max(20),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: '비밀번호 불일치', path: ['confirmPassword']
})

export const loginSchema = z.object({
  nickname: z.string().min(1, '닉네임 입력'),
  password: z.string().min(1, '비밀번호 입력'),
})

export const shopSchema = z.object({
  name: z.string().min(1, '가게 이름 필수').max(30),
  jobTitle: z.string().min(1, '직업 필수').max(20),
  description: z.string().max(200).optional(),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, '메뉴 이름 필수').max(50),
  description: z.string().max(200).optional(),
  basePrice: z.number().min(0).optional(),
})

export const orderSchema = z.object({
  shopId: z.string().min(1),
  customRequest: z.string().min(1, '주문 내용 필수').max(500),
})

export const priceProposalSchema = z.object({
  proposedPrice: z.number().min(1, '가격 입력'),
  estimatedDate: z.string().min(1, '예정 날짜 선택'),
  ownerMessage: z.string().max(200).optional(),
})

export const transactionSchema = z.object({
  receiverId: z.string().min(1, '거래 상대 선택'),
  amount: z.number().min(1, '금액은 1 이상'),
  description: z.string().min(1, '거래 내용 필수').max(200),
})

export const reportSchema = z.object({
  reportedId: z.string().min(1, '신고 대상 입력'),
  reason: z.string().min(1, '죄목 필수').max(500),
  evidence: z.string().max(1000).optional(),
  orderId: z.string().optional(),
})

export const verdictSchema = z.object({
  verdict: z.string().min(1, '판결 내용 필수'),
  fineAmount: z.number().min(0, '벌금은 0 이상'),
})

export const judgePasswordSchema = z.object({
  password: z.string().min(1, '비밀번호 입력'),
})
