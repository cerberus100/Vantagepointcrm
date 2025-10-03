"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2,
  FileText,
  CreditCard,
  GraduationCap,
  User,
  Upload,
  Eye,
  Download,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Validation schemas
const signatureSchema = z.object({
  docType: z.enum(["W9", "BAA"]),
  envelopeId: z.string().min(1, "Envelope ID is required"),
  fileUrl: z.string().url("Valid file URL is required"),
});

const paymentSchema = z.object({
  type: z.enum(["ACH_VOIDED_CHECK"]),
  fileUrl: z.string().url("Valid file URL is required"),
  acctLast4: z.string().regex(/^\d{4}$/, "Last 4 digits must be exactly 4 numbers").optional(),
});

const trainingSchema = z.object({
  score: z.number().min(0).max(100),
  attestation: z.string().min(10, "Attestation must be at least 10 characters"),
  ipAddr: z.string().optional(),
});

const credentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignatureFormData = z.infer<typeof signatureSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;
type TrainingFormData = z.infer<typeof trainingSchema>;
type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface OnboardingData {
  invitation: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleForHire: string;
    expiresAt: string;
  };
  status: {
    step: number;
    status: string;
    completed: string[];
    signatures: Array<{
      docType: string;
      status: string;
      signedAt: string;
    }>;
    paymentDocs: Array<{
      type: string;
      uploadedAt: string;
    }>;
    training: {
      score: number;
      passed: boolean;
      attested: boolean;
    } | null;
  };
}

const steps = [
  { id: 1, title: "Documents", icon: FileText, description: "Sign BAA and W-9" },
  { id: 2, title: "Payment", icon: CreditCard, description: "Upload voided check" },
  { id: 3, title: "Training", icon: GraduationCap, description: "Complete compliance training" },
  { id: 4, title: "Credentials", icon: User, description: "Create your account" },
  { id: 5, title: "Complete", icon: CheckCircle2, description: "Welcome to VantagePoint!" },
];

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form hooks
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const trainingForm = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
  });

  const credentialsForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  useEffect(() => {
    if (token) {
      fetchOnboardingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding/invite/${token}`);
      if (!response.ok) {
        throw new Error("Invalid or expired invitation");
      }
      const data = await response.json();
      setOnboardingData(data);
      setCurrentStep(data.status.step);
    } catch (error) {
      toast.error("Invalid or expired invitation link");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          inviteId: onboardingData?.invitation.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit payment document");
      
      toast.success("Payment document uploaded successfully!");
      await fetchOnboardingData();
    } catch {
      toast.error("Failed to upload payment document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrainingSubmit = async (data: TrainingFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          inviteId: onboardingData?.invitation.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit training");
      
      toast.success("Training completed successfully!");
      await fetchOnboardingData();
    } catch {
      toast.error("Failed to submit training");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialsSubmit = async (data: CredentialsFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          inviteId: onboardingData?.invitation.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to create credentials");
      
      toast.success("Account created successfully! You can now log in.");
      router.push("/login");
    } catch {
      toast.error("Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (!onboardingData) return null;

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Document Signing</h2>
              <p className="text-muted">Please review and sign the required documents</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* BAA Document */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5 text-accent" />
                    Business Associate Agreement (BAA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-[3/4] bg-panel-2 rounded-lg border border-line flex items-center justify-center">
                    <div className="text-center text-muted">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>BAA Document Preview</p>
                      <p className="text-sm">Click to view full document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-line text-primary hover:bg-panel-2">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="border-line text-primary hover:bg-panel-2">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <Button className="w-full bg-accent text-primary hover:bg-accent/90">
                    Sign BAA
                  </Button>
                </CardContent>
              </Card>

              {/* W-9 Document */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5 text-accent" />
                    IRS W-9 Form
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-[3/4] bg-panel-2 rounded-lg border border-line flex items-center justify-center">
                    <div className="text-center text-muted">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>W-9 Form Preview</p>
                      <p className="text-sm">Official IRS template</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-line text-primary hover:bg-panel-2">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="border-line text-primary hover:bg-panel-2">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <Button className="w-full bg-accent text-primary hover:bg-accent/90">
                    Sign W-9
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted">
                Both documents must be signed to proceed. We use secure e-signature technology.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Payment Setup</h2>
              <p className="text-muted">Upload a voided check for ACH direct deposit setup</p>
            </div>

            <Card className="glass-panel max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CreditCard className="h-5 w-5 text-accent" />
                  Voided Check Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-primary">
                      Upload Voided Check
                    </Label>
                    <div className="border-2 border-dashed border-line rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted" />
                      <p className="text-muted mb-2">Drag and drop your voided check here</p>
                      <p className="text-sm text-muted">or click to browse</p>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mt-2"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // In a real app, upload to S3 and get presigned URL
                            paymentForm.setValue("fileUrl", `https://s3.amazonaws.com/bucket/${file.name}`);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted">
                      Accepted formats: PDF, JPG, PNG (max 10MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acctLast4" className="text-primary">
                      Last 4 digits of account number (optional)
                    </Label>
                    <Input
                      id="acctLast4"
                      {...paymentForm.register("acctLast4")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="1234"
                      maxLength={4}
                    />
                    <p className="text-xs text-muted">
                      We never store your full account number
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-primary hover:bg-accent/90"
                  >
                    {submitting ? "Uploading..." : "Upload Document"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Compliance Training</h2>
              <p className="text-muted">Complete the training quiz and attestation</p>
            </div>

            <Card className="glass-panel max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  Training Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={trainingForm.handleSubmit(handleTrainingSubmit)} className="space-y-6">
                  {/* Mock Quiz Questions */}
                  <div className="space-y-4">
                    <div className="p-4 bg-panel-2 rounded-lg border border-line">
                      <h4 className="font-medium text-primary mb-2">Question 1: HIPAA Compliance</h4>
                      <p className="text-muted text-sm mb-3">
                        What is the minimum necessary standard in HIPAA?
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q1" value="a" className="text-accent" />
                          <span className="text-primary">Use only the minimum amount of PHI necessary</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q1" value="b" className="text-accent" />
                          <span className="text-primary">Store all PHI in encrypted databases</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q1" value="c" className="text-accent" />
                          <span className="text-primary">Require two-factor authentication</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-panel-2 rounded-lg border border-line">
                      <h4 className="font-medium text-primary mb-2">Question 2: Data Security</h4>
                      <p className="text-muted text-sm mb-3">
                        What should you do if you suspect a data breach?
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q2" value="a" className="text-accent" />
                          <span className="text-primary">Report immediately to your supervisor</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q2" value="b" className="text-accent" />
                          <span className="text-primary">Wait 24 hours before reporting</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="q2" value="c" className="text-accent" />
                          <span className="text-primary">Handle it yourself</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="score" className="text-primary">
                      Quiz Score (0-100)
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      {...trainingForm.register("score", { valueAsNumber: true })}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="85"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attestation" className="text-primary">
                      Attestation
                    </Label>
                    <textarea
                      id="attestation"
                      {...trainingForm.register("attestation")}
                      className="w-full bg-panel border border-line text-primary placeholder:text-muted focus:border-accent rounded-md px-3 py-2 min-h-[100px]"
                      placeholder="I acknowledge that I have read and understand the compliance requirements..."
                    />
                    {trainingForm.formState.errors.attestation && (
                      <p className="text-bad text-sm">{trainingForm.formState.errors.attestation.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="attestation-check" required />
                    <Label htmlFor="attestation-check" className="text-primary">
                      I certify that the information provided is accurate and complete
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-primary hover:bg-accent/90"
                  >
                    {submitting ? "Submitting..." : "Submit Training"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Create Credentials</h2>
              <p className="text-muted">Set up your account username and password</p>
            </div>

            <Card className="glass-panel max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <User className="h-5 w-5 text-accent" />
                  Account Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-primary">
                      Username
                    </Label>
                    <Input
                      id="username"
                      {...credentialsForm.register("username")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="john.doe"
                    />
                    {credentialsForm.formState.errors.username && (
                      <p className="text-bad text-sm">{credentialsForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-primary">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...credentialsForm.register("password")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="Enter a strong password"
                    />
                    {credentialsForm.formState.errors.password && (
                      <p className="text-bad text-sm">{credentialsForm.formState.errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted">
                      Must be at least 12 characters with uppercase, lowercase, number, and symbol
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-primary">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...credentialsForm.register("confirmPassword")}
                      className="bg-panel border-line text-primary placeholder:text-muted focus:border-accent"
                      placeholder="Confirm your password"
                    />
                    {credentialsForm.formState.errors.confirmPassword && (
                      <p className="text-bad text-sm">{credentialsForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-primary hover:bg-accent/90"
                  >
                    {submitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2 className="h-16 w-16 text-good mx-auto mb-4" />
            </motion.div>
            <h2 className="text-3xl font-bold text-primary">Welcome to VantagePoint!</h2>
            <p className="text-muted text-lg">
              Your onboarding is complete. You can now access your account.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="bg-accent text-primary hover:bg-accent/90"
            >
              Go to Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Invalid Invitation</h1>
          <p className="text-muted">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">New Hire Onboarding</h1>
          <p className="text-muted">
            Welcome, {onboardingData.invitation.firstName}! Complete these steps to get started.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => {
              const isCompleted = onboardingData.status.completed.includes(step.title.toLowerCase());
              const isCurrent = step.id === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? "bg-good border-good text-white"
                        : isCurrent
                        ? "bg-accent border-accent text-primary"
                        : "bg-panel border-line text-muted"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${isCurrent ? "text-primary" : "text-muted"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / 5) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="glass-panel">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
