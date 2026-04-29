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

	await seedDemo();

	console.log('🎉 数据填充完成！');
}

// ==========================================
// Demo 账户：用于展示，故事完整、曲线漂亮
// ==========================================
async function seedDemo() {
	console.log('🌟 开始填充 Demo 账户...');

	const hashedPassword = await bcrypt.hash('demo1234', 10);

	const demo = await prisma.user.upsert({
		where: { email: 'demo@firemaster.com' },
		update: { password: hashedPassword, name: 'Demo · 林溪' },
		create: {
			email: 'demo@firemaster.com',
			name: 'Demo · 林溪',
			password: hashedPassword,
		},
	});

	// 幂等：清理旧数据再写入新的
	await prisma.firePlan.deleteMany({ where: { userId: demo.id } });
	await prisma.cashFlowRecord.deleteMany({ where: { userId: demo.id } });
	await prisma.assetAccount.deleteMany({ where: { userId: demo.id } }); // 级联删除 AssetRecord
	await prisma.conversation.deleteMany({ where: { userId: demo.id } });

	// FIRE 计划：30 岁，目标 50 岁退休
	await prisma.firePlan.create({
		data: {
			userId: demo.id,
			name: '50 岁财务自由计划',
			currentAge: 30,
			retirementAge: 50,
			lifeExpectancy: 85,
			annualExpense: 180000,
			expectedReturn: 0.07,
			inflationRate: 0.03,
			note: '中等储蓄率 + 长期持有，奔向 1000 万净资产',
		},
	});

	// 资产账户（净资产约 151 万）
	const accountsConfig = [
		{ name: '招商银行储蓄卡', type: 'CASH' as const, currency: 'CNY', balance: 80000, history: false },
		{ name: '余额宝 / 货币基金', type: 'CASH' as const, currency: 'CNY', balance: 120000, history: false },
		{ name: 'A股核心持仓', type: 'STOCK' as const, currency: 'CNY', balance: 350000, history: 'stock-a' },
		{ name: '美股 QQQ', type: 'STOCK' as const, currency: 'CNY', balance: 200000, history: 'stock-us' },
		{ name: 'BTC', type: 'CRYPTO' as const, currency: 'CNY', balance: 60000, history: 'btc' },
		{ name: '自住房（市价估算）', type: 'REAL_ESTATE' as const, currency: 'CNY', balance: 2500000, history: 'house' },
		{ name: '房贷余额', type: 'DEBT' as const, currency: 'CNY', balance: -1800000, history: 'mortgage' },
	];

	const accounts = await Promise.all(
		accountsConfig.map((c) =>
			prisma.assetAccount.create({
				data: {
					userId: demo.id,
					name: c.name,
					type: c.type,
					currency: c.currency,
					currentBalance: c.balance,
				},
			}),
		),
	);

	console.log(`✅ Demo: ${accounts.length} 个资产账户`);

	// 24 个月资产历史快照
	// 趋势：股票/BTC 整体上行 + 月度波动；房贷线性递减；房产基本不变
	const MONTHS = 24;
	const records: Array<{ assetAccountId: string; recordDate: Date; amount: number; note: string }> = [];

	for (let i = MONTHS; i >= 0; i--) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		date.setDate(28); // 月末快照
		const t = (MONTHS - i) / MONTHS; // 0 → 1

		const noise = (seed: number) => {
			// 确定性伪随机，避免每次 seed 出来的曲线不同
			const x = Math.sin((i + 1) * seed) * 10000;
			return x - Math.floor(x);
		};

		for (let idx = 0; idx < accountsConfig.length; idx++) {
			const cfg = accountsConfig[idx];
			if (!cfg.history) continue;
			let amount = 0;
			switch (cfg.history) {
				case 'stock-a': {
					// 起点 28 万 → 终点 35 万，+/- 6% 波动
					const trend = 280000 + (350000 - 280000) * t;
					amount = trend * (1 + (noise(13) - 0.5) * 0.12);
					break;
				}
				case 'stock-us': {
					// 起点 14 万 → 终点 20 万（QQQ 强势），波动稍小
					const trend = 140000 + (200000 - 140000) * t;
					amount = trend * (1 + (noise(17) - 0.5) * 0.08);
					break;
				}
				case 'btc': {
					// 起点 3 万 → 终点 6 万，波动很大（BTC 风格）
					const trend = 30000 + (60000 - 30000) * t;
					amount = trend * (1 + (noise(23) - 0.5) * 0.35);
					break;
				}
				case 'house': {
					// 250 万估值，缓慢上行，几乎无月波动
					amount = 2400000 + 100000 * t;
					break;
				}
				case 'mortgage': {
					// 房贷从 -195 万 线性还到 -180 万（月供慢慢压低本金）
					amount = -1950000 + (-1800000 - -1950000) * t;
					break;
				}
			}
			records.push({
				assetAccountId: accounts[idx].id,
				recordDate: new Date(date),
				amount: Math.round(amount),
				note: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')} 快照`,
			});
		}
	}

	await prisma.assetRecord.createMany({ data: records });
	console.log(`✅ Demo: ${records.length} 条资产历史快照（${MONTHS} 个月 × 5 个账户）`);

	// 6 个月现金流记录
	const cashFlow: Array<{
		recordDate: Date;
		type: 'INCOME' | 'EXPENSE';
		amount: number;
		category: string;
		note: string;
	}> = [];

	for (let m = 5; m >= 0; m--) {
		const monthStart = new Date();
		monthStart.setMonth(monthStart.getMonth() - m);
		monthStart.setDate(1);

		const ymd = (day: number) => {
			const d = new Date(monthStart);
			d.setDate(day);
			return d;
		};
		const month = monthStart.getMonth() + 1;

		// 收入
		cashFlow.push({ recordDate: ymd(10), type: 'INCOME', amount: 25000, category: '工资', note: `${month}月工资` });
		cashFlow.push({ recordDate: ymd(15), type: 'INCOME', amount: 3000, category: '副业', note: '技术咨询' });
		// 季度奖金（3, 6, 9, 12 月）
		if ([3, 6, 9, 12].includes(month)) {
			cashFlow.push({ recordDate: ymd(20), type: 'INCOME', amount: 30000, category: '奖金', note: '季度奖金' });
		}
		// 季度股息
		if ([3, 6, 9, 12].includes(month)) {
			cashFlow.push({ recordDate: ymd(25), type: 'INCOME', amount: 1200, category: '投资', note: '股息分红' });
		}

		// 支出
		cashFlow.push({ recordDate: ymd(2), type: 'EXPENSE', amount: 8000, category: '房贷', note: '月供' });
		cashFlow.push({ recordDate: ymd(5), type: 'EXPENSE', amount: 2500, category: '餐饮', note: '日常餐饮' });
		cashFlow.push({ recordDate: ymd(8), type: 'EXPENSE', amount: 800, category: '交通', note: '通勤 + 打车' });
		cashFlow.push({ recordDate: ymd(12), type: 'EXPENSE', amount: 1500, category: '购物', note: '日用 + 衣物' });
		cashFlow.push({ recordDate: ymd(18), type: 'EXPENSE', amount: 800, category: '娱乐', note: '电影 + 游戏' });
		cashFlow.push({ recordDate: ymd(22), type: 'EXPENSE', amount: 500, category: '健康', note: '运动 + 体检' });
		// 偶发旅行（每两个月一次）
		if (m % 2 === 0) {
			cashFlow.push({ recordDate: ymd(15), type: 'EXPENSE', amount: 5000, category: '旅行', note: '周末出游' });
		}
	}

	await prisma.cashFlowRecord.createMany({
		data: cashFlow.map((r) => ({ userId: demo.id, ...r })),
	});

	const totalIncome = cashFlow.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
	const totalExpense = cashFlow.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
	console.log(
		`✅ Demo: ${cashFlow.length} 条现金流记录（半年收入 ¥${totalIncome.toLocaleString()} / 支出 ¥${totalExpense.toLocaleString()}）`,
	);

	console.log(`🎬 Demo 账户就绪：demo@firemaster.com / demo1234`);
}

main()
	.catch((e) => {
		console.error('❌ 填充数据失败:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
