import prisma from '../../lib/prisma';

export async function getCurrentUserStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      verificationStatus: true,
      kebeleId: true,
      _count: {
        select: {
          supportRequests: true,
          donations: true
        }
      }
    }
  });

  if (!user) return "User not found.";

  // Fetch pending requests specifically for context
  const pendingRequests = await prisma.supportRequest.findMany({
    where: { userId, status: 'PENDING_REVIEW' },
    select: { title: true, status: true, createdAt: true }
  });

  return JSON.stringify({
    accountDetails: user,
    pendingRequests: pendingRequests
  });
}
