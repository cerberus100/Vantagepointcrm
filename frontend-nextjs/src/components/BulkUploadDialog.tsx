"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  invitations: Array<{
    email: string;
    status: 'success' | 'failed';
    id?: string;
    error?: string;
  }>;
}

interface ParsedRow {
  firstName: string;
  lastName: string;
  email: string;
  roleForHire?: string;
}

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setResult(null);

    // Parse CSV
    if (uploadedFile.name.endsWith('.csv')) {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as ParsedRow[];
          setParsedData(data);
          toast.success(`Parsed ${data.length} rows from CSV`);
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
        },
      });
    } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
      // For Excel files, we'll need to handle differently
      toast.info("Excel file detected. Processing...");
      // TODO: Add Excel parsing with xlsx library
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // For now, show a message that Excel support is coming
          toast.warning("Excel support coming soon. Please use CSV format.");
        } catch (error) {
          toast.error("Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to upload");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/hiring/invitations/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          invitations: parsedData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process bulk upload");
      }

      const uploadResult: BulkUploadResult = await response.json();
      setResult(uploadResult);
      
      if (uploadResult.successful > 0) {
        toast.success(`Successfully sent ${uploadResult.successful} invitations!`);
      }
      if (uploadResult.failed > 0) {
        toast.warning(`${uploadResult.failed} invitations failed`);
      }
    } catch (error) {
      toast.error("Failed to process bulk upload");
      console.error("Bulk upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-line text-primary hover:bg-panel-2">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-line max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Bulk Invitation Upload
          </DialogTitle>
          <DialogDescription className="text-muted">
            Upload a CSV or Excel file with new hire information to send invitations in bulk.
            Maximum 100 invitations per batch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* CSV Template Download */}
          <div className="bg-panel-2 p-4 rounded-lg border border-line">
            <h4 className="font-medium text-primary mb-2">CSV Template Format</h4>
            <p className="text-sm text-muted mb-3">
              Your file should have the following columns: <code className="bg-panel px-2 py-1 rounded">firstName</code>, <code className="bg-panel px-2 py-1 rounded">lastName</code>, <code className="bg-panel px-2 py-1 rounded">email</code>, <code className="bg-panel px-2 py-1 rounded">roleForHire</code> (optional)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const template = "firstName,lastName,email,roleForHire\nJohn,Doe,john.doe@example.com,AGENT\nJane,Smith,jane.smith@example.com,AGENT";
                const blob = new Blob([template], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'hiring_template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="border-accent/30 text-accent hover:bg-accent/10"
            >
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          {!file && !result && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-accent bg-accent/5"
                  : "border-line hover:border-accent/50 hover:bg-panel-2"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted" />
              {isDragActive ? (
                <p className="text-primary">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-primary mb-2">Drag and drop your CSV or Excel file here</p>
                  <p className="text-sm text-muted">or click to browse</p>
                  <p className="text-xs text-muted mt-2">Supports .csv, .xlsx, .xls (max 100 rows)</p>
                </>
              )}
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-primary">
                  Preview ({parsedData.length} invitations)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted hover:text-primary"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-line rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-line">
                      <TableHead className="bg-panel-2 text-muted">#</TableHead>
                      <TableHead className="bg-panel-2 text-muted">First Name</TableHead>
                      <TableHead className="bg-panel-2 text-muted">Last Name</TableHead>
                      <TableHead className="bg-panel-2 text-muted">Email</TableHead>
                      <TableHead className="bg-panel-2 text-muted">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index} className="border-line">
                        <TableCell className="text-muted">{index + 1}</TableCell>
                        <TableCell className="text-primary">{row.firstName}</TableCell>
                        <TableCell className="text-primary">{row.lastName}</TableCell>
                        <TableCell className="text-primary">{row.email}</TableCell>
                        <TableCell className="text-primary">{row.roleForHire || 'AGENT'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted bg-panel-2 border-t border-line">
                    + {parsedData.length - 10} more rows
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-accent text-primary hover:bg-accent/90"
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                      </motion.div>
                      Processing {parsedData.length} invitations...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Send {parsedData.length} Invitations
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={50} className="h-2" />
              <p className="text-sm text-muted text-center">
                Sending invitations... Please wait.
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-panel-2 p-4 rounded-lg border border-line text-center">
                  <p className="text-2xl font-bold text-primary">{result.total}</p>
                  <p className="text-sm text-muted">Total</p>
                </div>
                <div className="bg-good/10 p-4 rounded-lg border border-good/30 text-center">
                  <p className="text-2xl font-bold text-good">{result.successful}</p>
                  <p className="text-sm text-muted">Successful</p>
                </div>
                <div className="bg-bad/10 p-4 rounded-lg border border-bad/30 text-center">
                  <p className="text-2xl font-bold text-bad">{result.failed}</p>
                  <p className="text-sm text-muted">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-primary flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-bad" />
                    Errors ({result.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-line rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-line">
                          <TableHead className="bg-panel-2 text-muted">Row</TableHead>
                          <TableHead className="bg-panel-2 text-muted">Email</TableHead>
                          <TableHead className="bg-panel-2 text-muted">Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((error, index) => (
                          <TableRow key={index} className="border-line">
                            <TableCell className="text-muted">{error.row}</TableCell>
                            <TableCell className="text-primary">{error.email}</TableCell>
                            <TableCell className="text-bad text-sm">{error.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-accent text-primary hover:bg-accent/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 border-line text-primary hover:bg-panel-2"
                >
                  Upload Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
