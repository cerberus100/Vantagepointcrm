"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, Inbox, AlertCircle, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";

interface Lead {
  id: string;
  practice: string;
  owner: string;
  email: string;
  phone: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  status: 'contacted' | 'new';
  ptan: string;
}

interface DataTableProps {
  data?: Lead[];
  loading?: boolean;
  error?: string;
}

const mockData: Lead[] = [
  {
    id: "1",
    practice: "Advanced Cardiology Center",
    owner: "Sarah Johnson",
    email: "sarah@cardiology.com",
    phone: "(555) 123-4567",
    location: "Los Angeles, CA",
    priority: "high",
    status: "contacted",
    ptan: "ABC123"
  },
  {
    id: "2",
    practice: "Metro Health Systems",
    owner: "Mike Chen",
    email: "mike@metrohealth.com",
    phone: "(555) 987-6543",
    location: "New York, NY",
    priority: "medium",
    status: "new",
    ptan: "XYZ789"
  },
  {
    id: "3",
    practice: "Regional Medical Group",
    owner: "Emily Davis",
    email: "emily@regionalmed.com",
    phone: "(555) 456-7890",
    location: "Chicago, IL",
    priority: "low",
    status: "contacted",
    ptan: "DEF456"
  },
  {
    id: "4",
    practice: "Coastal Healthcare",
    owner: "David Wilson",
    email: "david@coastalhealth.com",
    phone: "(555) 321-0987",
    location: "Miami, FL",
    priority: "high",
    status: "new",
    ptan: "GHI789"
  },
  {
    id: "5",
    practice: "Mountain View Clinic",
    owner: "Lisa Rodriguez",
    email: "lisa@mountainview.com",
    phone: "(555) 654-3210",
    location: "Denver, CO",
    priority: "medium",
    status: "contacted",
    ptan: "JKL012"
  },
  {
    id: "6",
    practice: "Sunrise Medical",
    owner: "Robert Taylor",
    email: "robert@sunrisemed.com",
    phone: "(555) 789-0123",
    location: "Phoenix, AZ",
    priority: "low",
    status: "new",
    ptan: "MNO345"
  },
  {
    id: "7",
    practice: "Valley Health Partners",
    owner: "Jennifer Brown",
    email: "jennifer@valleyhealth.com",
    phone: "(555) 012-3456",
    location: "Seattle, WA",
    priority: "high",
    status: "contacted",
    ptan: "PQR678"
  },
  {
    id: "8",
    practice: "Central Medical Center",
    owner: "Michael Garcia",
    email: "michael@centralmed.com",
    phone: "(555) 345-6789",
    location: "Dallas, TX",
    priority: "medium",
    status: "new",
    ptan: "STU901"
  }
];

export function DataTable({ data = mockData, loading = false, error }: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'contacted':
        return <CheckCircle2 className="h-4 w-4 text-good" />;
      case 'new':
        return <Sparkles className="h-4 w-4 text-info" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'contacted':
        return 'Contacted';
      case 'new':
        return 'New';
      default:
        return status;
    }
  };

  if (error) {
    return (
      <div className="glass-panel p-8 text-center">
        <AlertCircle className="h-12 w-12 text-bad mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">Error Loading Data</h3>
        <p className="text-muted">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-line">
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
                <input type="checkbox" className="rounded border-line" disabled />
              </TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Practice</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Owner</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Email</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Phone</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">City/State</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Priority</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">PTAN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="border-line">
                <TableCell><div className="h-4 w-4 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-32 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-40 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-28 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-panel-2 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-panel-2 rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <Inbox className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">No leads found</h3>
        <p className="text-muted mb-6">Get started by creating your first lead.</p>
        <Button className="bg-accent text-primary hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Lead
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-line">
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">
              <input 
                type="checkbox" 
                className="rounded border-line bg-panel text-accent focus:ring-accent focus:ring-offset-0"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRows(new Set(data.map(item => item.id)));
                  } else {
                    setSelectedRows(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Practice</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Owner</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Email</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Phone</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">City/State</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Priority</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">Status</TableHead>
            <TableHead className="bg-panel-2 text-muted font-semibold uppercase tracking-wide">PTAN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow 
              key={lead.id} 
              className="table-row-hover border-line cursor-pointer"
              onClick={() => toggleRowSelection(lead.id)}
            >
              <TableCell>
                <input 
                  type="checkbox" 
                  className="rounded border-line bg-panel text-accent focus:ring-accent focus:ring-offset-0"
                  checked={selectedRows.has(lead.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleRowSelection(lead.id);
                  }}
                />
              </TableCell>
              <TableCell className="font-medium text-primary">{lead.practice}</TableCell>
              <TableCell className="text-primary">{lead.owner}</TableCell>
              <TableCell className="text-primary">{lead.email}</TableCell>
              <TableCell className="text-primary">{lead.phone}</TableCell>
              <TableCell className="text-primary">{lead.location}</TableCell>
              <TableCell>
                <PriorityBadge priority={lead.priority} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(lead.status)}
                  <span className="text-primary">{getStatusLabel(lead.status)}</span>
                </div>
              </TableCell>
              <TableCell className="text-primary">{lead.ptan}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
