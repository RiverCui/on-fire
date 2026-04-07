'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AssetType } from '@/generated/prisma/client';

const ASSET_TYPES = Object.values(AssetType) as [string, ...string[]];

const assetAccountSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(50),
  type: z.enum(ASSET_TYPES, { message: 'Invalid asset type.' }),
  currency: z.string().min(1).max(10).default('CNY'),
  currentBalance: z.coerce.number().min(0, 'Balance must be non-negative.'),
});

export type AssetActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function createAssetAccount(
  _prevState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const parsed = assetAccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    currency: formData.get('currency') || 'CNY',
    currentBalance: formData.get('currentBalance'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.assetAccount.create({
    data: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type as AssetType,
      currency: parsed.data.currency,
      currentBalance: parsed.data.currentBalance,
    },
  });

  revalidatePath('/dashboard/account');
  return { success: true, message: 'Account created.' };
}

export async function updateAssetAccount(
  id: string,
  _prevState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const parsed = assetAccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    currency: formData.get('currency') || 'CNY',
    currentBalance: formData.get('currentBalance'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Ensure the account belongs to the user
  const account = await prisma.assetAccount.findFirst({
    where: { id, userId },
  });
  if (!account) return { message: 'Account not found.' };

  await prisma.assetAccount.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type as AssetType,
      currency: parsed.data.currency,
      currentBalance: parsed.data.currentBalance,
    },
  });

  revalidatePath('/dashboard/account');
  return { success: true, message: 'Account updated.' };
}

export async function deleteAssetAccount(id: string): Promise<AssetActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized.' };

  const account = await prisma.assetAccount.findFirst({
    where: { id, userId },
  });
  if (!account) return { message: 'Account not found.' };

  await prisma.assetAccount.delete({ where: { id } });

  revalidatePath('/dashboard/account');
  return { success: true, message: 'Account deleted.' };
}
