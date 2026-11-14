import { Workspace, Membership } from '../models/index.js';

export class WorkspaceService {
  /**
   * Create a new organization workspace and register owner membership.
   */
  static async createWorkspace(ownerId, workspaceData) {
    // Check if slug is unique
    const existing = await Workspace.findOne({ slug: workspaceData.slug });
    if (existing) {
      const error = new Error(`Workspace slug '${workspaceData.slug}' is already taken`);
      error.statusCode = 409;
      throw error;
    }

    const workspace = await Workspace.create({
      ...workspaceData,
      owner: ownerId,
    });

    // Create owner ADMIN membership
    await Membership.create({
      workspace: workspace._id,
      user: ownerId,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    return workspace;
  }

  /**
   * Get workspace by slug.
   */
  static async getWorkspaceBySlug(slug) {
    const workspace = await Workspace.findOne({ slug }).populate('owner', 'name email avatar');
    if (!workspace) {
      const error = new Error(`Workspace with slug '${slug}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return workspace;
  }

  /**
   * List workspaces with pagination.
   */
  static async listWorkspaces({ skip = 0, limit = 10, sort = '-createdAt', filter = {} }) {
    const [workspaces, total] = await Promise.all([
      Workspace.find(filter).sort(sort).skip(skip).limit(limit).populate('owner', 'name email'),
      Workspace.countDocuments(filter),
    ]);

    return { workspaces, total };
  }
}

export default WorkspaceService;
