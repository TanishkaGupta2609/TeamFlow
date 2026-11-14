import { asyncHandler, sendSuccess } from '../utils/index.js';
import { CalendarService } from '../services/calendar.service.js';

/**
 * @desc    Get calendar deadlines and milestones
 * @route   GET /api/workspaces/:workspaceId/calendar
 * @access  Protected (MEMBER)
 */
export const getCalendarEvents = asyncHandler(async (req, res) => {
  const { startDate, endDate, projectId, assigneeId, priority } = req.query;
  const events = await CalendarService.getCalendarEvents(req.workspaceId, {
    startDate,
    endDate,
    projectId,
    assigneeId,
    priority,
  });
  return sendSuccess(res, events, 'Calendar events retrieved successfully');
});
