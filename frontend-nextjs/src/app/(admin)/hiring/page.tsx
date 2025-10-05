"use client";

import { useState } from "react";
import { UserPlus, Mail, Clock, CheckCircle2, RefreshCw, X } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Validation schema
const inviteSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  roleForHire: z.string().default("AGENT"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface HiringInvite {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_for_hire: string;
  status: string;
  created_at: string;
  expires_at: string;
  opened_at?: string;
  consumed_at?: string;
}

const statusConfig = {
  SENT: { label: "Sent", color: "bg-info/15 text-info border-info/30", icon: Mail },
  OPENED: { label: "Opened", color: "bg-warn/15 text-warn border-warn/30", icon: Clock },
  DOCS: { label: "Documents", color: "bg-accent/15 text-accent border-accent/30", icon: CheckCircle2 },
  PAYMENT: { label: "Payment", color: "bg-accent/15 text-accent border-accent/30", icon: CheckCircle2 },
  TRAINED: { label: "Trained", color: "bg-accent/15 text-accent border-accent/30", icon: CheckCircle2 },
  ACTIVATED: { label: "Activated", color: "bg-good/15 text-good border-good/30", icon: CheckCircle2 },
  REVOKED: { label: "Revoked", color: "bg-bad/15 text-bad border-bad/30", icon: X },
  EXPIRED: { label: "Expired", color: "bg-muted/15 text-muted border-muted/30", icon: Clock },
};

export default function HiringPage() {
  const [invites, setInvites] = useState<HiringInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roleForHire: "AGENT",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/hiring/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create invitation");
      }

      const newInvite = await response.json();
      setInvites(prev => [newInvite, ...prev]);
      reset();
      toast.success("Invitation sent successfully!");
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error("Error creating invitation:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/hiring/invitations/${inviteId}/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to resend invitation");
      }

      toast.success("Invitation resent successfully!");
    } catch (error) {
      toast.error("Failed to resend invitation");
      console.error("Error resending invitation:", error);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/hiring/invitations/${inviteId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to revoke invitation");
      }

      setInvites(prev => 
        prev.map(invite => 
          invite.id === inviteId 
            ? { ...invite, status: "REVOKED" }
            : invite
        )
      );
      toast.success("Invitation revoked successfully!");
    } catch (error) {
      toast.error("Failed to revoke invitation");
      console.error("Error revoking invitation:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SENT;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Hiring Management</h1>
              <p className="text-muted">Send invitations and track new hire onboarding progress</p>
            </div>
            <BulkUploadDialog />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Send Invite Card */}
          <div className="lg:col-span-1">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5 text-accent" />
                  Send Invite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-primary">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-bad text-sm">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-primary">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-bad text-sm">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="john.doe@example.com"
                    />
                    {errors.email && (
                      <p className="text-bad text-sm">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleForHire" className="text-primary">
                      Role for Hire
                    </Label>
                    <Input
                      id="roleForHire"
                      {...register("roleForHire")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="AGENT"
                      defaultValue="AGENT"
                    />
                  </div>

                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-accent text-primary hover:bg-accent/90 focus-ring"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Invitations Table */}
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-primary">Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invitations sent yet</p>
                    <p className="text-sm">Send your first invitation using the form on the left</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-line">
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Name
                          </TableHead>
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Email
                          </TableHead>
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Role
                          </TableHead>
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Status
                          </TableHead>
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Sent
                          </TableHead>
                          <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invites.map((invite) => (
                          <motion.tr
                            key={invite.id}
                            className="table-row-hover border-line"
                            whileHover={{ backgroundColor: "var(--panel-2)" }}
                            transition={{ duration: 0.1 }}
                          >
                            <TableCell className="font-medium text-primary">
                              {invite.first_name} {invite.last_name}
                            </TableCell>
                            <TableCell className="text-primary">{invite.email}</TableCell>
                            <TableCell className="text-primary">{invite.role_for_hire}</TableCell>
                            <TableCell>{getStatusBadge(invite.status)}</TableCell>
                            <TableCell className="text-muted">
                              {formatDate(invite.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {invite.status === "SENT" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResend(invite.id)}
                                    className="border-line text-primary hover:bg-panel-2"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Resend
                                  </Button>
                                )}
                                {!["ACTIVATED", "REVOKED"].includes(invite.status) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-bad/30 text-bad hover:bg-bad/10"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Revoke
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-panel border-line">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-primary">
                                          Revoke Invitation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted">
                                          Are you sure you want to revoke this invitation? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-line text-primary hover:bg-panel-2">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRevoke(invite.id)}
                                          className="bg-bad text-white hover:bg-bad/90"
                                        >
                                          Revoke
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
