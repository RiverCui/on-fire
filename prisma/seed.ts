import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';

// 加载环境变量
config();

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 开始填充数据...');

	const hashedPassword = await bcrypt.hash('123456', 10);

	// 1. 创建测试用户
	const user = await prisma.user.upsert({
		where: { email: 'test@example.com' },
		update: {
			password: hashedPassword,
		},
		create: {
			email: 'test@example.com',
			name: '测试用户',
			password: hashedPassword,
		},
	});

	console.log(`✅ 创建用户: ${user.name} (${user.email})`);

	// 2. 创建 FIRE 退休计划
	const firePlan = await prisma.firePlan.create({
		data: {
			userId: user.id,
			name: '35岁退休计划',
			currentAge: 28,
			retirementAge: 35,
			lifeExpectancy: 85,
			annualExpense: 120000, // 年支出 12 万
			expectedReturn: 0.07,
			inflationRate: 0.03,
			note: '目标：35岁实现财务自由',
		},
	});

	console.log(`✅ 创建退休计划: ${firePlan.name}`);

	// 3. 创建资产账户
	const accounts = await Promise.all([
		prisma.assetAccount.create({
			data: {
				userId: user.id,
				name: '招商银行储蓄卡',
				type: 'CASH',
				currency: 'CNY',
				currentBalance: 50000,
			},
		}),
		prisma.assetAccount.create({
			data: {
				userId: user.id,
				name: 'A股账户',
				type: 'STOCK',
				currency: 'CNY',
				currentBalance: 200000,
			},
		}),
		prisma.assetAccount.create({
			data: {
				userId: user.id,
				name: '债券基金',
				type: 'BOND',
				currency: 'CNY',
				currentBalance: 100000,
			},
		}),
		prisma.assetAccount.create({
			data: {
				userId: user.id,
				name: 'BTC',
				type: 'CRYPTO',
				currency: 'USD',
				currentBalance: 5000,
			},
		}),
		prisma.assetAccount.create({
			data: {
				userId: user.id,
				name: '房贷',
				type: 'DEBT',
				currency: 'CNY',
				currentBalance: -800000, // 负债用负数表示
			},
		}),
	]);

	console.log(`✅ 创建 ${accounts.length} 个资产账户`);

	// 4. 创建资产历史记录（模拟过去几个月的数据）
	const stockAccount = accounts.find((a) => a.type === 'STOCK')!;
	const assetRecords = [];

	for (let i = 5; i >= 0; i--) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);

		assetRecords.push({
			assetAccountId: stockAccount.id,
			recordDate: date,
			amount: 180000 + Math.random() * 40000, // 18万-22万之间波动
			note: `${date.getMonth() + 1}月快照`,
		});
	}

	await prisma.assetRecord.createMany({
		data: assetRecords,
	});

	console.log(`✅ 创建 ${assetRecords.length} 条资产历史记录`);

	// 5. 创建现金流记录
	const cashFlowRecords = [
		// 收入
		{ type: 'INCOME' as const, amount: 25000, category: '工资', note: '11月工资' },
		{ type: 'INCOME' as const, amount: 25000, category: '工资', note: '10月工资' },
		{ type: 'INCOME' as const, amount: 5000, category: '副业', note: '自由职业收入' },
		{ type: 'INCOME' as const, amount: 2000, category: '投资', note: '股息分红' },
		// 支出
		{ type: 'EXPENSE' as const, amount: 3500, category: '房租', note: '11月房租' },
		{ type: 'EXPENSE' as const, amount: 2000, category: '餐饮', note: '11月餐饮' },
		{ type: 'EXPENSE' as const, amount: 500, category: '交通', note: '11月交通' },
		{ type: 'EXPENSE' as const, amount: 1000, category: '娱乐', note: '11月娱乐' },
		{ type: 'EXPENSE' as const, amount: 800, category: '购物', note: '日用品' },
	];

	await prisma.cashFlowRecord.createMany({
		data: cashFlowRecords.map((record, index) => ({
			userId: user.id,
			recordDate: new Date(Date.now() - index * 3 * 24 * 60 * 60 * 1000), // 每条记录间隔3天
			...record,
		})),
	});

	console.log(`✅ 创建 ${cashFlowRecords.length} 条现金流记录`);

	console.log('🎉 数据填充完成！');
}

main()
	.catch((e) => {
		console.error('❌ 填充数据失败:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
