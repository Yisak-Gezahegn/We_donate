import prisma from '../../lib/prisma';

export async function getKebeleWorkSummary(userId: string) {
  // Verify user is a Kebele Admin and get their kebeleId
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, kebeleId: true }
  });

  if (!admin || admin.role !== 'KEBELE_ADMIN' || !admin.kebeleId) {
    return "Error: You are not authorized to view Kebele-level work summaries or you have no assigned Kebele.";
  }

  const kebeleId = admin.kebeleId;

  // Aggregate pending work for this specific Kebele
  const pendingVerifications = await prisma.user.count({
    where: { kebeleId, verificationStatus: 'PENDING', role: 'USER' }
  });

  const pendingRequests = await prisma.supportRequest.count({
    where: { user: { kebeleId }, status: 'PENDING_REVIEW' }
  });

  const pendingDonations = await prisma.donation.count({
    where: {
      supportRequest: { user: { kebeleId } },
      paymentStatus: 'PENDING',
      paymentMethod: { not: 'ITEM' }
    }
  });

  return JSON.stringify({
    scope: 'KEBELE_ADMIN',
    kebeleId: kebeleId,
    pendingCitizenVerifications: pendingVerifications,
    pendingSupportRequests: pendingRequests,
    pendingDonationVerifications: pendingDonations
  });
}
