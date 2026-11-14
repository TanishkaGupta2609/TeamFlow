import React, { useState } from 'react';
import { UserPlus, Search, Mail, Shield, MoreVertical, Trash2, Edit } from 'lucide-react';
import { mockMembers } from '../services/mockData';
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
  const [members, setMembers] = useState(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite modal form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember = {
      id: `usr_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      designation: 'Invited Member',
      joinedDate: 'Pending Invite',
      assignedProjects: 0,
      status: 'offline',
    };

    setMembers([newMember, ...members]);
    setInviteModalOpen(false);
    setInviteEmail('');
    toast.success('Invitation Dispatched', `Invite email sent to ${inviteEmail}.`);
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
      render: (_, member) => (
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="sm" status={member.status} />
          <div>
            <span className="font-heading font-bold text-xs text-charcoal block">
              {member.name}
            </span>
            <span className="text-[11px] text-charcoal-secondary">{member.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation / Title',
      render: (des) => <span className="text-xs text-charcoal font-medium">{des}</span>,
    },
    {
      key: 'role',
      header: 'Workspace Role',
      render: (role) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${
            roleBadges[role] || 'bg-ivory text-charcoal'
          }`}
        >
          {role}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'Joined Date',
      render: (date) => <span className="text-xs text-charcoal-secondary font-mono">{date}</span>,
    },
    {
      key: 'assignedProjects',
      header: 'Projects',
      render: (count) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ivory border border-border">
          {count} assigned
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s === 'online' ? 'active' : s === 'away' ? 'on_hold' : 'todo'} label={s} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, member) => (
        <DropdownMenu
          align="right"
          trigger={<IconButton icon={<MoreVertical className="w-3.5 h-3.5" />} aria-label="Member options" size="sm" />}
          items={[
            {
              label: 'Make Admin',
              onClick: () => toast.success('Role Updated', `${member.name} is now an Admin.`),
            },
            {
              label: 'Make Manager',
              onClick: () => toast.success('Role Updated', `${member.name} is now a Manager.`),
            },
            { type: 'divider' },
            {
              label: 'Remove from Workspace',
              danger: true,
              onClick: () => {
                setMembers(members.filter((m) => m.id !== member.id));
                toast.error('Removed', `${member.name} was removed from this workspace.`);
              },
            },
          ]}
        />
      ),
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
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setInviteModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-white rounded-xl border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <SearchInput
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            id="role-filter"
            options={[
              { label: 'All Roles', value: 'all' },
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Manager', value: 'MANAGER' },
              { label: 'Member', value: 'MEMBER' },
              { label: 'Viewer', value: 'VIEWER' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Team Data Table */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        emptyTitle="No Members Found"
        emptyDescription="No collaborators match your search or role filter."
      />

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Teammate"
        description="They will receive a secure invitation link to join this workspace."
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
            id="inv-member-email"
            label="Work Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-charcoal-secondary" />}
            required
            autoFocus
          />

          <Select
            id="inv-member-role"
            label="Workspace Permission Role"
            options={[
              { label: 'Member (Can view, create and complete tasks)', value: 'MEMBER' },
              { label: 'Manager (Can manage projects, sprints, and assignments)', value: 'MANAGER' },
              { label: 'Admin (Full access to settings, members, and billing)', value: 'ADMIN' },
              { label: 'Viewer (Read-only observation access)', value: 'VIEWER' },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default TeamPage;
