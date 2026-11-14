import crypto from 'crypto';
import mongoose from 'mongoose';
import { Workspace, Membership, User, Invitation } from '../models/index.js';

export class WorkspaceService {
  /**
   * Helper to generate a unique URL-friendly slug.
   */
  static generateSlug(title) {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    return `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Helper to hash an invitation or reset token with SHA-256.
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new organization workspace and register the creator as ADMIN owner.
   */
  static async createWorkspace(ownerId, workspaceData) {
    const slug = workspaceData.slug || this.generateSlug(workspaceData.name);

    // Verify slug uniqueness
    const existing = await Workspace.findOne({ slug });
    if (existing) {
      const error = new Error(`Workspace slug '${slug}' is already taken`);
      error.statusCode = 409;
      throw error;
    }

    const workspace = await Workspace.create({
      name: workspaceData.name,
      slug,
      description: workspaceData.description || '',
      logo: workspaceData.logo || '',
      owner: ownerId,
      settings: workspaceData.settings || {
        allowMemberInvites: true,
        defaultProjectVisibility: 'PUBLIC',
      },
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
   * List all workspaces where the user has an active membership.
   */
  static async getUserWorkspaces(userId) {
    const memberships = await Membership.find({
      user: userId,
      status: 'ACTIVE',
    }).populate({
      path: 'workspace',
      populate: { path: 'owner', select: 'name email avatar' },
    });

    const results = await Promise.all(
      memberships.map(async (m) => {
        if (!m.workspace) return null;
        const memberCount = await Membership.countDocuments({
          workspace: m.workspace._id,
          status: 'ACTIVE',
        });
        return {
          workspace: m.workspace,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
          memberCount,
        };
      })
    );

    return results.filter(Boolean);
  }

  /**
   * Get workspace details by ID or slug.
   */
  static async getWorkspaceById(workspaceId, userId = null) {
    const isObjectId = mongoose.Types.ObjectId.isValid(workspaceId);
    const query = isObjectId ? { _id: workspaceId } : { slug: workspaceId };

    const workspace = await Workspace.findOne(query).populate('owner', 'name email avatar');
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    const memberCount = await Membership.countDocuments({
      workspace: workspace._id,
      status: 'ACTIVE',
    });

    let userRole = null;
    if (userId) {
      const membership = await Membership.findOne({
        workspace: workspace._id,
        user: userId,
        status: 'ACTIVE',
      });
      userRole = membership ? membership.role : null;
    }

    return {
      workspace,
      memberCount,
      userRole,
    };
  }

  /**
   * Update workspace configuration details.
   */
  static async updateWorkspace(workspaceId, updateData) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.name) workspace.name = updateData.name;
    if (updateData.description !== undefined) workspace.description = updateData.description;
    if (updateData.logo !== undefined) workspace.logo = updateData.logo;
    if (updateData.settings) {
      workspace.settings = {
        ...workspace.settings,
        ...updateData.settings,
      };
    }

    await workspace.save();
    return workspace;
  }

  /**
   * Delete workspace. Only the workspace owner can perform this action.
   */
  static async deleteWorkspace(workspaceId, actorUserId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    if (workspace.owner.toString() !== actorUserId.toString()) {
      const error = new Error('Forbidden: Only the workspace owner can delete this organization');
      error.statusCode = 403;
      throw error;
    }

    await Promise.all([
      Workspace.findByIdAndDelete(workspaceId),
      Membership.deleteMany({ workspace: workspaceId }),
      Invitation.deleteMany({ workspace: workspaceId }),
    ]);

    return { success: true };
  }

  /**
   * Get all active and invited members of a workspace.
   */
  static async getWorkspaceMembers(workspaceId) {
    const memberships = await Membership.find({ workspace: workspaceId })
      .populate('user', 'name email avatar designation isActive')
      .sort({ createdAt: 1 });

    return memberships.map((m) => ({
      _id: m._id,
      user: m.user,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Update a member's role within the workspace.
   */
  static async updateMemberRole(workspaceId, memberId, newRole, actorUserId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    const membership = await Membership.findById(memberId);
    if (!membership || membership.workspace.toString() !== workspaceId.toString()) {
      const error = new Error('Membership record not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Owner protection: cannot demote workspace owner
    if (workspace.owner.toString() === membership.user.toString()) {
      const error = new Error('Cannot change the role of the workspace owner');
      error.statusCode = 400;
      throw error;
    }

    membership.role = newRole;
    await membership.save();

    return membership;
  }

  /**
   * Update a member's active/suspended status.
   */
  static async updateMemberStatus(workspaceId, memberId, newStatus, actorUserId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    const membership = await Membership.findById(memberId);
    if (!membership || membership.workspace.toString() !== workspaceId.toString()) {
      const error = new Error('Membership record not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Cannot suspend owner
    if (workspace.owner.toString() === membership.user.toString()) {
      const error = new Error('Cannot change status of the workspace owner');
      error.statusCode = 400;
      throw error;
    }

    membership.status = newStatus;
    await membership.save();

    return membership;
  }

  /**
   * Remove a member from the workspace.
   */
  static async removeMember(workspaceId, memberId, actorUserId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    const membership = await Membership.findById(memberId);
    if (!membership || membership.workspace.toString() !== workspaceId.toString()) {
      const error = new Error('Membership record not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Protection: cannot remove owner
    if (workspace.owner.toString() === membership.user.toString()) {
      const error = new Error('Cannot remove the workspace owner from the organization');
      error.statusCode = 400;
      throw error;
    }

    await Membership.findByIdAndDelete(memberId);
    return { success: true };
  }

  /**
   * Invite a user to the workspace by email.
   */
  static async inviteMember(workspaceId, inviterId, { email, role = 'MEMBER' }) {
    const normalizedEmail = email.toLowerCase().trim();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      const error = new Error('Workspace not found');
      error.statusCode = 404;
      throw error;
    }

    // 1. Check if recipient is already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const existingMembership = await Membership.findOne({
        workspace: workspaceId,
        user: existingUser._id,
        status: 'ACTIVE',
      });
      if (existingMembership) {
        const error = new Error(`User '${normalizedEmail}' is already an active member of this workspace`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 2. Check for active pending invitation
    const pendingInvitation = await Invitation.findOne({
      workspace: workspaceId,
      email: normalizedEmail,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });
    if (pendingInvitation) {
      const error = new Error(`A pending invitation for '${normalizedEmail}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      workspace: workspaceId,
      email: normalizedEmail,
      invitedBy: inviterId,
      role,
      tokenHash,
      expiresAt,
      status: 'PENDING',
    });

    return {
      invitation,
      token, // Returned for programmatic email dispatch or verification
    };
  }

  /**
   * List pending invitations for a workspace.
   */
  static async getWorkspaceInvitations(workspaceId) {
    const invitations = await Invitation.find({
      workspace: workspaceId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    return invitations;
  }

  /**
   * Resend an invitation with a refreshed token and expiry.
   */
  static async resendInvitation(workspaceId, invitationId) {
    const invitation = await Invitation.findOne({
      _id: invitationId,
      workspace: workspaceId,
    });

    if (!invitation) {
      const error = new Error('Invitation not found');
      error.statusCode = 404;
      throw error;
    }

    const token = crypto.randomBytes(32).toString('hex');
    invitation.tokenHash = this.hashToken(token);
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.status = 'PENDING';
    await invitation.save();

    return {
      invitation,
      token,
    };
  }

  /**
   * Revoke a pending invitation.
   */
  static async revokeInvitation(workspaceId, invitationId) {
    const invitation = await Invitation.findOne({
      _id: invitationId,
      workspace: workspaceId,
    });

    if (!invitation) {
      const error = new Error('Invitation not found');
      error.statusCode = 404;
      throw error;
    }

    invitation.status = 'REVOKED';
    await invitation.save();

    return { success: true };
  }

  /**
   * Public preview of invitation details via token.
   */
  static async getInvitationByToken(rawToken) {
    const tokenHash = this.hashToken(rawToken);

    const invitation = await Invitation.findOne({ tokenHash })
      .populate('workspace', 'name slug logo description')
      .populate('invitedBy', 'name email avatar');

    if (!invitation) {
      const error = new Error('Invalid or unknown invitation token');
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status !== 'PENDING') {
      const error = new Error(`Invitation is no longer active (Status: ${invitation.status})`);
      error.statusCode = 410;
      throw error;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      const error = new Error('Invitation has expired');
      error.statusCode = 410;
      throw error;
    }

    return invitation;
  }

  /**
   * Accept an invitation and add the authenticated user as a workspace member.
   */
  static async acceptInvitation(rawToken, user) {
    const tokenHash = this.hashToken(rawToken);

    const invitation = await Invitation.findOne({ tokenHash });
    if (!invitation) {
      const error = new Error('Invalid or unknown invitation token');
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status !== 'PENDING') {
      const error = new Error(`Invitation is not pending (Status: ${invitation.status})`);
      error.statusCode = 400;
      throw error;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      const error = new Error('Invitation has expired');
      error.statusCode = 400;
      throw error;
    }

    // Check if user is already a member
    let membership = await Membership.findOne({
      workspace: invitation.workspace,
      user: user._id,
    });

    if (membership) {
      membership.role = invitation.role;
      membership.status = 'ACTIVE';
      await membership.save();
    } else {
      membership = await Membership.create({
        workspace: invitation.workspace,
        user: user._id,
        role: invitation.role,
        status: 'ACTIVE',
      });
    }

    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date();
    await invitation.save();

    const workspace = await Workspace.findById(invitation.workspace);

    return {
      workspace,
      membership,
    };
  }

  /**
   * Reject an invitation.
   */
  static async rejectInvitation(rawToken) {
    const tokenHash = this.hashToken(rawToken);

    const invitation = await Invitation.findOne({ tokenHash });
    if (!invitation) {
      const error = new Error('Invalid or unknown invitation token');
      error.statusCode = 404;
      throw error;
    }

    invitation.status = 'REVOKED';
    await invitation.save();

    return { success: true };
  }
}

export default WorkspaceService;
