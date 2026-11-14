import { asyncHandler, sendSuccess } from '../utils/index.js';
import { AnalyticsService } from '../services/analytics.service.js';

/**
 * @desc    Get workspace analytics and productivity reports
 * @route   GET /api/workspaces/:workspaceId/analytics
 * @access  Protected (MEMBER)
 */
export const getWorkspaceAnalytics = asyncHandler(async (req, res) => {
  const analytics = await AnalyticsService.getWorkspaceAnalytics(req.workspaceId);
  return sendSuccess(res, analytics, 'Analytics data retrieved successfully');
});
