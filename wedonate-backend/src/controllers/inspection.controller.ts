import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getInspectionReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const reports = await prisma.inspectionReport.findMany({
      where: status ? { status: status as any } : {},
      include: {
        inspector: { select: { firstName: true, lastName: true, email: true } },
        supportRequest: { select: { title: true, id: true } },
        campaign: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
};

export const createInspectionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supportRequestId, campaignId, findings, recommendation, imageUrl } = req.body;
    if (!findings) return next(createError('Findings are required', 400));
    if (!supportRequestId && !campaignId) return next(createError('A support request or campaign must be specified', 400));

    const report = await prisma.inspectionReport.create({
      data: {
        id: uuidv4(),
        inspectorId: req.user!.userId,
        supportRequestId: supportRequestId || null,
        campaignId: campaignId || null,
        findings,
        recommendation: recommendation || null,
        imageUrl: imageUrl || null,
      },
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const resolveInspection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.inspectionReport.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED' },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'RESOLVE_INSPECTION', resource: 'inspection_report', resourceId: req.params.id, details: 'Resolved inspection report' },
    });
    res.json({ success: true, data: report, message: 'Inspection report resolved' });
  } catch (error) { next(error); }
};

export const deleteInspection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.inspectionReport.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Inspection report deleted' });
  } catch (error) { next(error); }
};
