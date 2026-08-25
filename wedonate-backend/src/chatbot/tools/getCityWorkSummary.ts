import prisma from '../../lib/prisma';

export async function getCityWorkSummary(userId: string) {
  // Verify user is a City Admin
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!admin || admin.role !== 'CITY_ADMIN') {
    return "Error: You are not authorized to view City-level work summaries.";
  }

  // Aggregate pending work across the platform for City Admins
  const pendingOrganizations = await prisma.user.count({
    where: { role: 'ORGANIZATION', verificationStatus: 'PENDING' }
  });

  const pendingCampaigns = await prisma.campaign.count({
    where: { status: 'PENDING_REVIEW' }
  });

  const pendingAssistedRequests = await prisma.supportRequest.count({
    where: { status: 'PENDING_CITY_APPROVAL' }
  });

  const pendingOrgDonations = await prisma.donation.count({
    where: {
      campaignId: { not: null },
      paymentStatus: 'PENDING',
      paymentMethod: { not: 'ITEM' }
    }
  });

  return JSON.stringify({
    scope: 'CITY_ADMIN',
    pendingOrganizationVerifications: pendingOrganizations,
    pendingCampaignReviews: pendingCampaigns,
    pendingAssistedRequests: pendingAssistedRequests,
    pendingOrganizationDonations: pendingOrgDonations
  });
}
