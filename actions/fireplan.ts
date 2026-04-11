'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { firePlanFormSchema } from '@/lib/definitions';

export type FirePlanActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  planId?: string;
};

export async function saveFirePlan(
  data: {
    id?: string;
    name: string;
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    annualExpense: number;
    expectedReturn: number;
    inflationRate: number;
  },
): Promise<FirePlanActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const parsed = firePlanFormSchema.safeParse(data);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { id, name, currentAge, retirementAge, lifeExpectancy, annualExpense, expectedReturn, inflationRate } = parsed.data;

  if (id) {
    const existing = await prisma.firePlan.findFirst({
      where: { id, userId },
    });
    if (!existing) return { message: 'Plan not found.' };

    await prisma.firePlan.update({
      where: { id },
      data: { name, currentAge, retirementAge, lifeExpectancy, annualExpense, expectedReturn, inflationRate },
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'Plan updated.', planId: id };
  }

  const created = await prisma.firePlan.create({
    data: { userId, name, currentAge, retirementAge, lifeExpectancy, annualExpense, expectedReturn, inflationRate },
  });

  revalidatePath('/dashboard');
  return { success: true, message: 'Plan created.', planId: created.id };
}

export async function deleteFirePlan(id: string): Promise<FirePlanActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const plan = await prisma.firePlan.findFirst({
    where: { id, userId },
  });
  if (!plan) return { message: 'Plan not found.' };

  await prisma.firePlan.delete({ where: { id } });

  revalidatePath('/dashboard');
  return { success: true, message: 'Plan deleted.' };
}
