import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'juansylvie@gmail.com';

const user = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: { id: true, email: true },
});

if (!user) {
  console.log(JSON.stringify({ found: false, email: EMAIL }, null, 2));
  await prisma.$disconnect();
  process.exit(0);
}

const orders = await prisma.storeOrder.findMany({
  where: { userId: user.id },
  include: { product: true, key: true },
  orderBy: { createdAt: 'desc' },
});

const wallet = await prisma.wpggWallet.findUnique({ where: { userId: user.id } });

const txns = wallet
  ? await prisma.wpggTransaction.findMany({
      where: {
        walletId: wallet.id,
        type: 'STORE_PURCHASE',
      },
      orderBy: { createdAt: 'desc' },
    })
  : [];

console.log(
  JSON.stringify(
    {
      user,
      walletBalance: wallet?.balance ?? null,
      orders: orders.map((o) => ({
        id: o.id,
        productSlug: o.product.slug,
        productName: o.product.nameEs,
        priceWpgg: o.priceWpgg,
        keyId: o.keyId,
        keyStatus: o.key.status,
        keyValuePreview: o.key.keyValue.slice(0, 4) + '****',
        createdAt: o.createdAt,
      })),
      storePurchaseTransactions: txns.map((t) => ({
        id: t.id,
        amount: t.amount,
        referenceId: t.referenceId,
        description: t.description,
        createdAt: t.createdAt,
      })),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
