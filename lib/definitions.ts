import { z } from 'zod';
import type { AssetType, FlowType, Prisma } from '@/generated/prisma/client';

// 登录表单验证
export const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: '请输入合法邮箱' })
    .trim(),
  password: z
    .string()
    .min(8, { message: '密码至少 8 位' })
    .trim(),
});

// 注册表单验证
export const SignupFormSchema = LoginSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, { message: '请输入姓名' })
    .max(50, { message: '姓名过长' })
    .optional(),
});

// 注册表单值类型
export type SignupFormValues = z.infer<typeof SignupFormSchema>;

type DecimalValue = Prisma.Decimal;

type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

export type User = Timestamped & {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  image: string | null;
};

export type FirePlan = Timestamped & {
  id: string;
  userId: string;
  name: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  annualExpense: DecimalValue;
  withdrawalRate: DecimalValue;
  expectedReturn: DecimalValue;
  inflationRate: DecimalValue;
  customTarget: DecimalValue | null;
  note: string | null;
};

export type AssetAccount = Timestamped & {
  id: string;
  userId: string;
  name: string;
  type: AssetType;
  currency: string;
  currentBalance: DecimalValue;
};

export type AssetRecord = Timestamped & {
  id: string;
  assetAccountId: string;
  recordDate: Date;
  amount: DecimalValue;
  note: string | null;
};

export type CashFlowRecord = Timestamped & {
  id: string;
  userId: string;
  recordDate: Date;
  type: FlowType;
  amount: DecimalValue;
  category: string | null;
  note: string | null;
};

const cuidOrId = z.string().min(1);
const positiveMoney = z.coerce.number().finite().min(0, {
  message: '金额必须大于等于 0',
});
const percentSchema = z.coerce.number().finite().min(0).max(1);
const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/u, { message: '必须使用 3 位 ISO 货币代码' });

export const firePlanFormSchema = z.object({
  id: cuidOrId.optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: '请输入计划名称' })
    .max(64)
    .default('我的退休计划'),
  currentAge: z.coerce.number().int().min(16).max(80),
  retirementAge: z.coerce.number().int().min(16).max(90),
  lifeExpectancy: z.coerce.number().int().min(40).max(120),
  annualExpense: positiveMoney,
  withdrawalRate: percentSchema.default(0.04),
  expectedReturn: percentSchema.default(0.05),
  inflationRate: percentSchema.default(0.03),
  customTarget: positiveMoney.optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type FirePlanFormValues = z.infer<typeof firePlanFormSchema>;

export const assetAccountFormSchema = z.object({
  id: cuidOrId.optional(),
  name: z.string().trim().min(1).max(60),
  type: z.nativeEnum(AssetType),
  currency: currencySchema.default('CNY'),
  currentBalance: positiveMoney,
});

export type AssetAccountFormValues = z.infer<typeof assetAccountFormSchema>;

export const assetRecordFormSchema = z.object({
  id: cuidOrId.optional(),
  assetAccountId: cuidOrId,
  recordDate: z.coerce.date(),
  amount: positiveMoney,
  note: z.string().trim().max(280).optional().nullable(),
});

export type AssetRecordFormValues = z.infer<typeof assetRecordFormSchema>;

export const cashFlowFormSchema = z.object({
  id: cuidOrId.optional(),
  userId: cuidOrId.optional(),
  recordDate: z.coerce.date(),
  type: z.nativeEnum(FlowType),
  amount: positiveMoney.min(0.01, { message: '金额必须大于 0' }),
  category: z.string().trim().max(60).optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
});

export type CashFlowFormValues = z.infer<typeof cashFlowFormSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export type DashboardAssetSummary = {
  accountId: string;
  name: string;
  type: AssetType;
  currency: string;
  balance: number;
};

export type CashFlowTrendPoint = {
  date: string;
  income: number;
  expense: number;
};

export type FirePlanProjectionPoint = {
  year: number;
  portfolioValue: number;
  requiredCorpus: number;
};

export type LatestInvoiceRaw = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  amount: number;
};

export type LatestInvoice = Omit<LatestInvoiceRaw, 'amount'> & {
  amount: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type InvoicesTable = {
  id: string;
  customer_id?: string;
  name: string;
  email: string;
  image_url: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};
