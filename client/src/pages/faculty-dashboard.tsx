import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ComplaintCard from "@/components/complaint-card";
import AnnouncementCard from "@/components/announcement-card";
import ModernComplaintModal from "@/components/modern-complaint-modal";
import ComplaintDetailsModal from "@/components/complaint-details-modal";
import EnhancedAnnouncementForm from "@/components/enhanced-announcement-form";
import { Plus, Eye, Megaphone } from "lucide-react";
import type { Complaint, Announcement } from "@shared/schema";

export default function FacultyDashboard() {
  const { data: user } = useUser();
  const { toast } = useToast();
  
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/announcements"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/complaints/${complaintId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Faculty should only see complaints specifically assigned to them, not their own complaints
  const assignedComplaints = complaints.filter((c: Complaint) => 
    // Only show complaints that are assigned to this faculty member AND not created by them
    c.status === 'in_progress' && c.userId !== user?.id
  );

  const handleComplaintAction = (action: string, complaintId: number) => {
    if (action === 'resolve') {
      updateStatusMutation.mutate({ complaintId, status: 'resolved' });
    } else if (action === 'escalate') {
      updateStatusMutation.mutate({ complaintId, status: 'escalated' });
    }
  };

  if (complaintsLoading || announcementsLoading) {
    return (
      <div className="min-h-screen dashboard-employee-gradient flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <span className="material-icons animate-spin">refresh</span>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-employee-gradient">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">UH</span>
                </div>
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold">Faculty Dashboard</h1>
                <p className="text-white/80">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowComplaintForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Complaint
              </Button>
              <Button
                onClick={() => setShowAnnouncementForm(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Announce
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <span className="material-icons mr-2">logout</span>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm fade-in">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="material-icons text-3xl text-blue-600">assignment_ind</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Assigned Complaints</dt>
                    <dd className="text-lg font-medium text-gray-900">{assignedComplaints.length}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm fade-in">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="material-icons text-3xl text-orange-600">pending_actions</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignedComplaints.filter(c => c.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm fade-in">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="material-icons text-3xl text-green-600">check_circle</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Resolved Today</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {complaints.filter(c => c.status === 'resolved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Complaints */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">assignment_ind</span>
                  Assigned Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedComplaints.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-400 text-5xl">assignment_ind</span>
                      <p className="mt-2 text-gray-500">No complaints assigned yet</p>
                      <p className="text-sm text-gray-400">Complaints will appear here when assigned by your department head</p>
                    </div>
                  ) : (
                    assignedComplaints.map((complaint: Complaint) => (
                      <ComplaintCard
                        key={complaint.id}
                        complaint={complaint}
                        showActions={true}
                        onAction={handleComplaintAction}
                        userRole={user?.role}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements */}
          <div>
            <Card className="bg-white/90 backdrop-blur-sm fade-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="material-icons mr-2">campaign</span>
                    Announcements
                  </div>
                  <Button
                    onClick={() => setShowAnnouncementForm(true)}
                    className="bg-[#2e265e] hover:bg-[#2b6751] text-white"
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-400 text-4xl">campaign</span>
                      <p className="mt-2 text-gray-500">No announcements</p>
                    </div>
                  ) : (
                    announcements.slice(0, 3).map((announcement: Announcement) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm fade-in mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">flash_on</span>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowComplaintForm(true)}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700"
                  variant="ghost"
                >
                  <span className="material-icons mr-2">add_circle</span>
                  Submit New Complaint
                </Button>
                <Button 
                  className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700"
                  variant="ghost"
                  onClick={() => window.location.reload()}
                >
                  <span className="material-icons mr-2">refresh</span>
                  Refresh Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modern Complaint Form Modal */}
      <ModernComplaintModal
        isOpen={showComplaintForm}
        onSuccess={() => setShowComplaintForm(false)}
        onCancel={() => setShowComplaintForm(false)}
      />

      {/* Enhanced Announcement Form Modal */}
      <EnhancedAnnouncementForm
        userRole={user?.role || ''}
        userDepartmentId={user?.departmentId}
        isOpen={showAnnouncementForm}
        onSuccess={() => setShowAnnouncementForm(false)}
        onCancel={() => setShowAnnouncementForm(false)}
      />
    </div>
  );
}