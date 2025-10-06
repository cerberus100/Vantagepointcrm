"use client";

// API Configuration - Direct URL for production
const API_BASE_URL = 'https://3.83.217.40/api/v1';

import { Hospital, Settings, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function TopHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="accent-chip">
            <Hospital className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-primary">VantagePoint</h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted hover:text-primary hover:bg-panel-2"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-muted hover:text-primary hover:bg-panel-2"
              >
                <div className="h-8 w-8 rounded-full bg-accent-soft flex items-center justify-center">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <span className="hidden sm:inline">John Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-panel border-line">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem className="text-primary hover:bg-panel-2">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-primary hover:bg-panel-2">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-primary hover:bg-panel-2">
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem 
                className="text-primary hover:bg-panel-2 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
