import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteStorePurchasesForEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const orders = await prisma.storeOrder.findMany({
    where: { userId: user.id },
    include: { key: true, product: true },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) {
    console.log(`No store orders for ${email}`);
    return;
  }

  for (const order of orders) {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wpggWallet.findUnique({
        where: { userId: user.id },
      });

      if (wallet) {
        await tx.wpggTransaction.deleteMany({
          where: {
            walletId: wallet.id,
            referenceId: `purchase:${order.id}`,
          },
        });
        await tx.wpggWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.priceWpgg } },
        });
      }

      if (order.key.keyValue.startsWith('RIOT-DEV-')) {
        await tx.storeProductKey.delete({ where: { id: order.keyId } });
      } else {
        await tx.storeProductKey.update({
          where: { id: order.keyId },
          data: { status: 'AVAILABLE', assignedAt: null },
        });
      }

      await tx.storeOrder.delete({ where: { id: order.id } });
    });

    console.log(
      `Deleted order ${order.id} (${order.product.nameEn}, key ${order.key.keyValue}), refunded ${order.priceWpgg} WPGG`,
    );
  }
}

const email = process.argv[2] ?? 'juansylvie@gmail.com';

deleteStorePurchasesForEmail(email)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
