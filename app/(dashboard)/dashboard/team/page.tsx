'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  Loader2,
  MoreVertical,
  Trash2,
  Shield,
  Crown,
  Mail,
  Clock,
} from 'lucide-react';
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/use-members';
import { useOrganization } from '@/hooks/use-organization';
import { useAuth } from '@/lib/auth/context';
import { isAdmin } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, MemberStatus } from '@/types/database';
import type { MemberWithProfile } from '@/hooks/use-members';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  agency_owner: 'Agency Owner',
  business_owner: 'Business Owner',
  marketing_manager: 'Marketing Manager',
  content_manager: 'Content Manager',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-accent/10 text-accent border-accent/20',
  agency_owner: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  business_owner: 'bg-success/10 text-success border-success/20',
  marketing_manager: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  content_manager: 'bg-muted text-muted-foreground border-border',
  viewer: 'bg-muted text-muted-foreground border-border',
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: 'bg-success/10 text-success',
  invited: 'bg-warning/10 text-warning',
  revoked: 'bg-destructive/10 text-destructive',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TeamPage() {
  const { user } = useAuth();
  const { data: userOrg } = useOrganization();
  const { data: members, isLoading } = useMembers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<MemberWithProfile | null>(null);

  const canManageTeam = userOrg ? isAdmin(userOrg.role) : false;

  const memberCount = members?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            {memberCount > 0
              ? `${memberCount} member${memberCount !== 1 ? 's' : ''} in your organization`
              : 'Manage your team members and their roles'}
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2 bg-accent text-white hover:bg-accent/90">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </motion.div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <Badge
            key={role}
            variant="outline"
            className={`gap-1.5 text-[11px] ${ROLE_COLORS[role as UserRole]}`}
          >
            {label}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-2.5 w-48 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : memberCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Users className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No team members yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Invite team members to collaborate on campaigns, content, and ads.
          </p>
          {canManageTeam && (
            <Button onClick={() => setInviteOpen(true)} className="mt-4 gap-2 bg-accent text-white hover:bg-accent/90">
              <UserPlus className="h-4 w-4" />
              Invite Your First Member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {members!.map((member: MemberWithProfile, idx: number) => (
            <MemberRow
              key={member.id}
              member={member}
              index={idx}
              canManage={canManageTeam}
              currentUserId={user?.id}
              onRemove={() => setRemoveMember(member)}
            />
          ))}
        </div>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <RemoveDialog
        member={removeMember}
        onOpenChange={(open) => !open && setRemoveMember(null)}
      />
    </div>
  );
}

function MemberRow({
  member,
  index,
  canManage,
  currentUserId,
  onRemove,
}: {
  member: MemberWithProfile;
  index: number;
  canManage: boolean;
  currentUserId?: string;
  onRemove: () => void;
}) {
  const { toast } = useToast();
  const updateRole = useUpdateMemberRole();
  const [changing, setChanging] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const displayName = member.full_name || member.email || 'Unknown User';
  const initials = getInitials(member.full_name);

  const handleRoleChange = async (role: UserRole) => {
    setChanging(true);
    try {
      await updateRole.mutateAsync({ memberId: member.id, role });
      toast({ title: 'Role updated', description: `${displayName} is now ${ROLE_LABELS[role]}` });
    } catch {
      toast({ title: 'Failed to update role', variant: 'destructive' });
    } finally {
      setChanging(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-accent to-chart-2 text-xs font-semibold text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[10px]">You</Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {member.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {member.email}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Joined {new Date(member.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`hidden items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${STATUS_COLORS[member.status]}`}
        >
          {member.status}
        </span>

        {canManage && !isCurrentUser ? (
          <Select
            value={member.role}
            onValueChange={(v) => handleRoleChange(v as UserRole)}
            disabled={changing}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <SelectItem key={role} value={role} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            variant="outline"
            className={`gap-1 text-[11px] ${ROLE_COLORS[member.role]}`}
          >
            {member.role === 'business_owner' && <Crown className="h-3 w-3" />}
            {member.role === 'super_admin' && <Shield className="h-3 w-3" />}
            {ROLE_LABELS[member.role]}
          </Badge>
        )}

        {canManage && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const inviteMember = useInviteMember();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await inviteMember.mutateAsync({ email: email.trim(), role });
      toast({
        title: 'Member added',
        description: `${email} has been added to your organization.`,
      });
      setEmail('');
      setRole('viewer');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      toast({ title: 'Invitation failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add an existing GorillaGO user to your organization by their email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inviteEmail">Email address</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              The person must have a GorillaGO account with this email.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([roleValue, label]) => (
                  <SelectItem key={roleValue} value={roleValue}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMember.isPending}
              className="gap-2 bg-accent text-white hover:bg-accent/90"
            >
              {inviteMember.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDialog({
  member,
  onOpenChange,
}: {
  member: MemberWithProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const removeMember = useRemoveMember();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!member) return;
    setRemoving(true);
    try {
      await removeMember.mutateAsync(member.id);
      toast({ title: 'Member removed', description: `${member.full_name || member.email} has been removed.` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    } finally {
      setRemoving(false);
    }
  };

  const displayName = member?.full_name || member?.email || 'this member';

  return (
    <AlertDialog open={!!member} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove team member?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {displayName} from your organization. They will lose access
            to all products, campaigns, and settings. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={removing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {removing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
