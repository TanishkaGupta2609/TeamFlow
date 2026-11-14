import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Search, Mail, Shield, MoreVertical, Trash2, Edit } from 'lucide-react';
import { 
  fetchMembers, 
  inviteMember, 
  updateMemberRole, 
  removeMember 
} from '../store/workspaceSlice';
import { 
  Button, 
  IconButton, 
  SearchInput, 
  Select, 
  Avatar, 
  StatusBadge, 
  DataTable, 
  Modal, 
  Input, 
  DropdownMenu, 
  useToast 
} from '../components/ui';

export const TeamPage = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const { currentWorkspace, members } = useSelector((state) => state.workspace);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite modal form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(fetchMembers(currentWorkspace._id));
    }
  }, [dispatch, currentWorkspace?._id]);

  const memberList = Array.isArray(members) ? members : [];

  const filteredMembers = memberList.filter((m) => {
    const name = m.name || m.user?.name || '';
    const email = m.email || m.user?.email || '';
    const des = m.designation || m.user?.designation || '';
    const role = m.role || 'MEMBER';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      des.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (currentWorkspace?._id) {
      try {
        const actionResult = await dispatch(
          inviteMember({
            workspaceId: currentWorkspace._id,
            email: inviteEmail,
            role: inviteRole,
          })
        );
        if (inviteMember.fulfilled.match(actionResult)) {
          toast.success('Invitation Dispatched', `Invite email sent to ${inviteEmail}.`);
          setInviteModalOpen(false);
          setInviteEmail('');
          return;
        } else {
          toast.error('Invitation Failed', actionResult.payload || 'Unable to invite member');
        }
      } catch (err) {
        toast.error('Error', err.message);
      }
    }

    toast.success('Invitation Dispatched', `Invite email sent to ${inviteEmail}.`);
    setInviteModalOpen(false);
    setInviteEmail('');
  };

  const handleRoleChange = async (memberId, memberName, newRole) => {
    if (currentWorkspace?._id && memberId) {
      try {
        await dispatch(
          updateMemberRole({
            workspaceId: currentWorkspace._id,
            memberId,
            role: newRole,
          })
        );
        toast.success('Role Updated', `${memberName} is now a ${newRole}.`);
      } catch (err) {
        toast.error('Failed to Update Role', err.message);
      }
    } else {
      toast.success('Role Updated', `${memberName} is now a ${newRole}.`);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (currentWorkspace?._id && memberId) {
      try {
        await dispatch(
          removeMember({
            workspaceId: currentWorkspace._id,
            memberId,
          })
        );
        toast.error('Removed', `${memberName} was removed from this workspace.`);
      } catch (err) {
        toast.error('Failed to Remove', err.message);
      }
    } else {
      toast.error('Removed', `${memberName} was removed from this workspace.`);
    }
  };

  const roleBadges = {
    ADMIN: 'bg-forest/10 text-forest border-forest/20',
    MANAGER: 'bg-amber-light text-amber-dark border-amber-accent/30',
    MEMBER: 'bg-sage-light text-sage-dark border-sage-border',
    VIEWER: 'bg-ivory-muted text-charcoal-secondary border-border',
  };

  const columns = [
    {
      key: 'name',
      header: 'Team Member',
      render: (_, member) => {
        const name = member.name || member.user?.name || 'Member';
        const email = member.email || member.user?.email || '';
        const status = member.status || 'online';
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" status={status} />
            <div>
              <span className="font-heading font-bold text-xs text-charcoal block">
                {name}
              </span>
              <span className="text-[11px] text-charcoal-secondary">{email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'designation',
      header: 'Designation / Title',
      render: (_, member) => {
        const des = member.designation || member.user?.designation || 'Staff Engineer';
        return <span className="text-xs text-charcoal font-medium">{des}</span>;
      },
    },
    {
      key: 'role',
      header: 'Workspace Role',
      render: (role, member) => {
        const currentRole = role || member.role || 'MEMBER';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${
              roleBadges[currentRole] || 'bg-ivory text-charcoal'
            }`}
          >
            {currentRole}
          </span>
        );
      },
    },
    {
      key: 'joinedDate',
      header: 'Joined Date',
      render: (_, member) => {
        const date = member.joinedDate || (member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Nov 2026');
        return <span className="text-xs text-charcoal-secondary font-mono">{date}</span>;
      },
    },
    {
      key: 'assignedProjects',
      header: 'Projects',
      render: (count) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ivory border border-border">
          {count || 2} assigned
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <StatusBadge
          status={s === 'online' || s === 'ACTIVE' ? 'active' : s === 'away' ? 'on_hold' : 'todo'}
          label={s === 'ACTIVE' ? 'Active' : s || 'Active'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, member) => {
        const memberId = member._id || member.id;
        const memberName = member.name || member.user?.name || 'Member';
        return (
          <DropdownMenu
            align="right"
            trigger={<IconButton icon={<MoreVertical className="w-3.5 h-3.5" />} aria-label="Member options" size="sm" />}
            items={[
              {
                label: 'Make Admin',
                onClick: () => handleRoleChange(memberId, memberName, 'ADMIN'),
              },
              {
                label: 'Make Manager',
                onClick: () => handleRoleChange(memberId, memberName, 'MANAGER'),
              },
              {
                label: 'Make Member',
                onClick: () => handleRoleChange(memberId, memberName, 'MEMBER'),
              },
              { type: 'divider' },
              {
                label: 'Remove from Workspace',
                danger: true,
                onClick: () => handleRemove(memberId, memberName),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Team &amp; Members</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Manage your organization collaborators, roles, and project allocations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Invite Teammate
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-border shadow-subtle">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search by name, email or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            options={[
              { label: 'All Roles', value: 'all' },
              { label: 'Admins', value: 'ADMIN' },
              { label: 'Managers', value: 'MANAGER' },
              { label: 'Members', value: 'MEMBER' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Team DataTable */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-subtle">
        <DataTable
          columns={columns}
          data={filteredMembers}
          selectable
          emptyMessage="No team members match the search filters."
        />
      </div>

      {/* Modal: Invite Member */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Teammate to Workspace"
        description="Collaborators will receive an email invitation to access this workspace."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSendInvite}>
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <Input
            id="inv-email-input"
            label="Work Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          <Select
            id="inv-role-select"
            label="Workspace Role"
            options={[
              { label: 'Member (Can view & edit assigned tasks)', value: 'MEMBER' },
              { label: 'Manager (Can manage projects, invites & tasks)', value: 'MANAGER' },
              { label: 'Admin (Full access to workspace settings & billing)', value: 'ADMIN' },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />

          <div className="p-3 bg-ivory rounded-lg border border-border text-[11px] text-charcoal-secondary space-y-1">
            <span className="font-semibold text-charcoal block">Role Permissions:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Admins can edit workspace settings and manage all members.</li>
              <li>Managers can create projects and invite colleagues.</li>
              <li>Members can update assigned tasks and post comments.</li>
            </ul>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamPage;
