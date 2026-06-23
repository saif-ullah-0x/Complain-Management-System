import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { getQueryFn } from "@/lib/queryClient";
import { useRealtimeComplaints } from "@/hooks/use-realtime-complaints";
import ComplaintCard from "@/components/complaint-card";
import AnnouncementCard from "@/components/announcement-card";
import ModernComplaintModal from "@/components/modern-complaint-modal";
import ComplaintDetailsModal from "@/components/complaint-details-modal";
import ComplaintProgressView from "@/components/complaint-progress-view";
import { Plus, Eye, RefreshCw } from "lucide-react";
import type { Complaint, Announcement } from "@shared/schema";

export default function StudentDashboard() {
  const { data: user } = useUser();
  const { refreshComplaints } = useRealtimeComplaints();
  
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/announcements"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const stats = {
    total: complaints.length,
    resolved: complaints.filter((c: Complaint) => c.status === 'resolved').length,
    inProgress: complaints.filter((c: Complaint) => c.status === 'in_progress').length,
    pending: complaints.filter((c: Complaint) => c.status === 'pending').length,
  };

  const handleComplaintAction = (action: string, complaintId: number) => {
    if (action === 'view') {
      setSelectedComplaintId(complaintId);
      setShowDetailsModal(true);
    }
  };

  if (complaintsLoading || announcementsLoading) {
    return (
      <div className="min-h-screen dashboard-student-gradient flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <span className="material-icons animate-spin">refresh</span>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-student-gradient">
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
                <h1 className="text-white text-2xl font-bold">Student Dashboard</h1>
                <p className="text-white/80">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowComplaintForm(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Submit Complaint</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm fade-in">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="material-icons text-3xl text-blue-600">assignment</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Complaints</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm fade-in">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="material-icons text-3xl text-blue-600">hourglass_empty</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.resolved}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Complaints */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">list_alt</span>
                  My Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-400 text-5xl">assignment</span>
                      <p className="mt-2 text-gray-500">No complaints submitted yet</p>
                      <Button
                        onClick={() => setShowComplaintForm(true)}
                        className="mt-4"
                        variant="outline"
                      >
                        Submit Your First Complaint
                      </Button>
                    </div>
                  ) : (
                    complaints.map((complaint: Complaint) => (
                      <ComplaintCard
                        key={complaint.id}
                        complaint={complaint}
                        showActions={true}
                        onAction={handleComplaintAction}
                        userRole="student"
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
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">campaign</span>
                  Announcements
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
          </div>
        </div>
      </main>

      {/* Modern Complaint Modal */}
      <ModernComplaintModal
        isOpen={showComplaintForm}
        onSuccess={() => setShowComplaintForm(false)}
        onCancel={() => setShowComplaintForm(false)}
      />

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaintId={selectedComplaintId}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedComplaintId(null);
        }}
      />
    </div>
  );
}