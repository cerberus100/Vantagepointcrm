"use client";

import { Search, Plus, UserPlus, UsersRound, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Toolbar() {
  return (
    <div className="space-y-6">
      {/* Title and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-primary">Lead Management Center</h2>
        
        <div className="flex gap-3">
          <div className="relative flex-1 sm:flex-none sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search leads..."
              className="pl-10 rounded-xl bg-panel border-line text-primary placeholder:text-muted focus:border-accent focus:ring-accent"
            />
          </div>
          <Button className="button-press bg-accent text-primary hover:bg-accent/90 focus-ring">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="button-press bg-accent text-primary hover:bg-accent/90 focus-ring">
          <Plus className="h-4 w-4 mr-2" />
          Create Lead
        </Button>
        
        <Button variant="outline" className="button-press border-line text-primary hover:bg-panel-2 focus-ring">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
        
        <Button variant="outline" className="button-press border-line text-primary hover:bg-panel-2 focus-ring">
          <UsersRound className="h-4 w-4 mr-2" />
          Assign Leads
        </Button>
        
        <Button variant="outline" className="button-press border-line text-primary hover:bg-panel-2 focus-ring">
          <Send className="h-4 w-4 mr-2" />
          Send Docs
        </Button>
      </div>
    </div>
  );
}
