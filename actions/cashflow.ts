'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { FlowType } from '@/generated/prisma/client';

const cashFlowSchema = z.object({
  recordDate: z.coerce.date({ message: 'Invalid date.' }),
  type: z.enum([FlowType.INCOME, FlowType.EXPENSE], { message: 'Invalid type.' }),
  amount: z.coerce.number().positive('Amount must be positive.'),
  category: z.string().max(50).optional(),
  note: z.string().max(200).optional(),
});

export type CashFlowActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function createCashFlowRecord(
  _prevState: CashFlowActionState,
  formData: FormData,
): Promise<CashFlowActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const parsed = cashFlowSchema.safeParse({
    recordDate: formData.get('recordDate'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    category: formData.get('category') || undefined,
    note: formData.get('note') || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.cashFlowRecord.create({
    data: {
      userId,
      recordDate: parsed.data.recordDate,
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath('/dashboard/cashflow');
  return { success: true, message: 'Record created.' };
}

export async function updateCashFlowRecord(
  id: string,
  _prevState: CashFlowActionState,
  formData: FormData,
): Promise<CashFlowActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const parsed = cashFlowSchema.safeParse({
    recordDate: formData.get('recordDate'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    category: formData.get('category') || undefined,
    note: formData.get('note') || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const record = await prisma.cashFlowRecord.findFirst({ where: { id, userId } });
  if (!record) return { message: 'Record not found.' };

  await prisma.cashFlowRecord.update({
    where: { id },
    data: {
      recordDate: parsed.data.recordDate,
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath('/dashboard/cashflow');
  return { success: true, message: 'Record updated.' };
}

export async function deleteCashFlowRecord(id: string): Promise<CashFlowActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const record = await prisma.cashFlowRecord.findFirst({ where: { id, userId } });
  if (!record) return { message: 'Record not found.' };

  await prisma.cashFlowRecord.delete({ where: { id } });

  revalidatePath('/dashboard/cashflow');
  return { success: true, message: 'Record deleted.' };
}
