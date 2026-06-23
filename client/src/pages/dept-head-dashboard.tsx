import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ComplaintCard from "@/components/complaint-card";
import AnnouncementCard from "@/components/announcement-card";
import EnhancedAnnouncementForm from "@/components/enhanced-announcement-form";
import { Megaphone } from "lucide-react";
import type { Complaint, Announcement, FacultyStaff } from "@shared/schema";

export default function DeptHeadDashboard() {
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

  const { data: faculty = [], isLoading: facultyLoading } = useQuery({
    queryKey: ["/api/faculty", user?.departmentId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.departmentId,
  });

  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const assignMutation = useMutation({
    mutationFn: async ({ complaintId, facultyId }: { complaintId: number; facultyId: number }) => {
      return await apiRequest("PATCH", `/api/complaints/${complaintId}/assign`, { assignedTo: facultyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      setSelectedComplaint(null);
      setSelectedFaculty("");
      toast({
        title: "Success",
        description: "Complaint assigned to faculty successfully",
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

  const departmentComplaints = (complaints as Complaint[]).filter((c: Complaint) => 
    // Dept Head sees all department complaints
    true // Filter by department would be done server-side
  );

  const stats = {
    total: departmentComplaints.length,
    pending: (complaints as Complaint[]).filter((c: Complaint) => c.status === 'pending').length,
    resolved: (complaints as Complaint[]).filter((c: Complaint) => c.status === 'resolved').length,
    urgent: (complaints as Complaint[]).filter((c: Complaint) => c.priority === 'urgent').length,
  };

  const handleComplaintAction = (action: string, complaintId: number) => {
    if (action === 'assign') {
      setSelectedComplaint(complaintId);
    } else if (action === 'escalate') {
      updateStatusMutation.mutate({ complaintId, status: 'escalated' });
    } else if (action === 'resolve') {
      updateStatusMutation.mutate({ complaintId, status: 'resolved' });
    }
  };

  const handleAssignToFaculty = () => {
    if (selectedComplaint && selectedFaculty) {
      assignMutation.mutate({ 
        complaintId: selectedComplaint, 
        facultyId: parseInt(selectedFaculty) 
      });
    }
  };

  if (complaintsLoading || announcementsLoading || facultyLoading) {
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
                <h1 className="text-white text-2xl font-bold">Department Head Dashboard</h1>
                <p className="text-white/80">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowAnnouncementForm(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Create Announcement
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
                  <span className="material-icons text-3xl text-blue-600">dashboard</span>
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
                  <span className="material-icons text-3xl text-red-600">priority_high</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Urgent</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.urgent}</dd>
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
          {/* Department Complaints */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="material-icons mr-2">assignment</span>
                  Department Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentComplaints.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-400 text-5xl">assignment</span>
                      <p className="mt-2 text-gray-500">No complaints in your department</p>
                    </div>
                  ) : (
                    departmentComplaints.map((complaint: Complaint) => (
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

          <div>
            {/* Faculty Assignment */}
            {selectedComplaint && (
              <Card className="bg-white/90 backdrop-blur-sm fade-in mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="material-icons mr-2">person_add</span>
                    Assign to Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Select Faculty Member</label>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose faculty member" />
                      </SelectTrigger>
                      <SelectContent>
                        {(faculty as FacultyStaff[]).map((f: FacultyStaff) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.rollNoOrId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAssignToFaculty}
                      disabled={!selectedFaculty || assignMutation.isPending}
                      className="flex-1"
                    >
                      {assignMutation.isPending ? "Assigning..." : "Assign"}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedComplaint(null);
                        setSelectedFaculty("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            <Card className="bg-white/90 backdrop-blur-sm fade-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="material-icons mr-2">campaign</span>
                    Announcements
                  </div>
                  <Button
                    onClick={() => setShowAnnouncementForm(true)}
                    className="bg-[#46091c] hover:bg-[#10074c] text-white"
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Create Announcement
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(announcements as Announcement[]).length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-400 text-4xl">campaign</span>
                      <p className="mt-2 text-gray-500">No announcements</p>
                    </div>
                  ) : (
                    (announcements as Announcement[]).slice(0, 2).map((announcement: Announcement) => (
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