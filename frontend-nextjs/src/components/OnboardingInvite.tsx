"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Form data types
type SignatureFormData = z.infer<typeof signatureSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;
type TrainingFormData = z.infer<typeof trainingSchema>;
type CredentialsFormData = z.infer<typeof credentialsSchema>;

// API Configuration
const API_BASE_URL = 'https://3.83.217.40/api/v1';

export default function OnboardingInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [inviteData, setInviteData] = useState<{
    firstName: string;
    lastName: string;
    signatures?: Array<{ docType: string; envelopeId: string }>;
    paymentDocs?: Array<{ type: string; fileUrl: string }>;
    trainings?: Array<{ score: number; attestation: string }>;
    isActive: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const token = searchParams.get('token');

  const steps = [
    { id: 0, name: "Signatures", icon: FileText },
    { id: 1, name: "Payment", icon: CreditCard },
    { id: 2, name: "Training", icon: GraduationCap },
    { id: 3, name: "Credentials", icon: User },
  ];

  // Fetch invite data on mount
  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/hiring/invites/${token}`);
        if (!response.ok) throw new Error('Invalid or expired invite');
        
        const data = await response.json();
        setInviteData(data);
        
        // Check completed steps
        const completed = [
          data.signatures?.length >= 2,
          data.paymentDocs?.length > 0,
          data.trainings?.length > 0,
          data.isActive
        ];
        setCompletedSteps(completed);
        
        // Set current step to first incomplete
        const firstIncomplete = completed.findIndex(step => !step);
        setCurrentStep(firstIncomplete === -1 ? 0 : firstIncomplete);
      } catch (error) {
        toast.error("Failed to load invite data");
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInviteData();
    }
  }, [token, router]);

  const handleStepComplete = (stepIndex: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[stepIndex] = true;
    setCompletedSteps(newCompleted);
    
    // Move to next incomplete step or stay on last
    const nextIncomplete = newCompleted.findIndex((step, idx) => !step && idx > stepIndex);
    if (nextIncomplete !== -1) {
      setCurrentStep(nextIncomplete);
    } else if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">Invalid or expired invite link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to VantagePoint CRM
          </h1>
          <p className="text-slate-400">
            Complete your onboarding to get started as {inviteData.firstName} {inviteData.lastName}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = completedSteps[index];

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full
                      transition-all duration-200
                      ${isActive ? 'bg-cyan-500 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-slate-700 text-slate-400'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-24 h-1 mx-2 transition-all duration-200
                        ${isCompleted ? 'bg-green-500' : 'bg-slate-700'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between max-w-3xl mx-auto mt-2">
            {steps.map((step) => (
              <p key={step.id} className="text-sm text-slate-400">
                {step.name}
              </p>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <SignatureStep
                token={token}
                onComplete={() => handleStepComplete(0)}
              />
            )}
            {currentStep === 1 && (
              <PaymentStep
                token={token}
                onComplete={() => handleStepComplete(1)}
              />
            )}
            {currentStep === 2 && (
              <TrainingStep
                token={token}
                onComplete={() => handleStepComplete(2)}
              />
            )}
            {currentStep === 3 && (
              <CredentialsStep
                token={token}
                onComplete={() => handleStepComplete(3)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overall Progress */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{completedSteps.filter(Boolean).length} of {steps.length} steps completed</span>
          </div>
          <Progress 
            value={(completedSteps.filter(Boolean).length / steps.length) * 100} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
}

// Signature Step Component
function SignatureStep({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [w9File, setW9File] = useState<File | null>(null);
  const [baaFile, setBaaFile] = useState<File | null>(null);

  const handleFileSelect = (file: File, type: 'w9' | 'baa') => {
    if (type === 'w9') {
      setW9File(file);
    } else {
      setBaaFile(file);
    }
  };

  const handleUpload = async () => {
    if (!w9File || !baaFile) {
      toast.error("Please upload both W9 and BAA documents");
      return;
    }

    setUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('w9', w9File);
      formData.append('baa', baaFile);

      const response = await fetch(`${API_BASE_URL}/hiring/invites/${token}/signatures`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload signatures');
      
      toast.success("Signatures uploaded successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to upload signatures");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Required Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="w9">W9 Form</Label>
          <div className="mt-2 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              id="w9"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'w9')}
              className="hidden"
            />
            <label htmlFor="w9" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-400">
                {w9File ? w9File.name : "Click to upload W9 form"}
              </p>
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="baa">Business Associate Agreement (BAA)</Label>
          <div className="mt-2 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              id="baa"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'baa')}
              className="hidden"
            />
            <label htmlFor="baa" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-400">
                {baaFile ? baaFile.name : "Click to upload BAA"}
              </p>
            </label>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!w9File || !baaFile || uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload Documents"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Payment Step Component
function PaymentStep({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [checkFile, setCheckFile] = useState<File | null>(null);
  const [last4Digits, setLast4Digits] = useState("");

  const handleUpload = async () => {
    if (!checkFile || !last4Digits) {
      toast.error("Please upload voided check and enter last 4 digits");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('voidedCheck', checkFile);
      formData.append('acctLast4', last4Digits);

      const response = await fetch(`${API_BASE_URL}/hiring/invites/${token}/payment`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload payment info');
      
      toast.success("Payment information uploaded successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to upload payment information");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="check">Voided Check</Label>
          <div className="mt-2 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              id="check"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && setCheckFile(e.target.files[0])}
              className="hidden"
            />
            <label htmlFor="check" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-400">
                {checkFile ? checkFile.name : "Click to upload voided check"}
              </p>
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="last4">Last 4 Digits of Account</Label>
          <Input
            id="last4"
            type="text"
            maxLength={4}
            value={last4Digits}
            onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))}
            placeholder="0000"
            className="mt-2"
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!checkFile || last4Digits.length !== 4 || uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Submit Payment Information"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Training Step Component
function TrainingStep({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error("Please agree to complete the training");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/hiring/invites/${token}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: 100,
          attestation: "I have completed all required training modules and understand the policies and procedures.",
        }),
      });

      if (!response.ok) throw new Error('Failed to submit training');
      
      toast.success("Training completed successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to submit training completion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Training & Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">HIPAA Compliance Training</h3>
            <p className="text-sm text-slate-400">
              Complete the HIPAA compliance training module to understand patient privacy requirements.
            </p>
            <Button variant="outline" className="mt-3" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Training Materials
            </Button>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">Security Best Practices</h3>
            <p className="text-sm text-slate-400">
              Learn about security protocols and best practices for handling sensitive data.
            </p>
            <Button variant="outline" className="mt-3" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Training Materials
            </Button>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">Platform Overview</h3>
            <p className="text-sm text-slate-400">
              Get familiar with the VantagePoint CRM platform and its features.
            </p>
            <Button variant="outline" className="mt-3" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Training Materials
            </Button>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="training-complete"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label htmlFor="training-complete" className="text-sm text-slate-400 cursor-pointer">
            I confirm that I have completed all required training modules and understand the policies and procedures outlined in the training materials.
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Complete Training"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Credentials Step Component
function CredentialsStep({ token, onComplete }: { token: string; onComplete: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: CredentialsFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/hiring/invites/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to create credentials');
      
      toast.success("Account created successfully! Redirecting to login...");
      onComplete();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...form.register("username")}
              placeholder="Choose a username"
              className="mt-2"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="Create a strong password"
              className="mt-2"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Password must be at least 12 characters long
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              placeholder="Confirm your password"
              className="mt-2"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating Account..." : "Complete Onboarding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
