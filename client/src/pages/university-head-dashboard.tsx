import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ComplaintCard from "@/components/complaint-card";
import AnnouncementCard from "@/components/announcement-card";
import ComplaintDetailsModal from "@/components/complaint-details-modal";
import DepartmentWiseView from "@/components/department-wise-view";
import EnhancedAnnouncementForm from "@/components/enhanced-announcement-form";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, Users, AlertTriangle, CheckCircle, TrendingUp, Clock, LogOut, RefreshCw, Eye, PieChart as PieChartIcon } from "lucide-react";
import type { Complaint, Announcement } from "@shared/schema";

export default function UniversityHeadDashboard() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/announcements"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Process analytics data
  const analyticsData = {
    departmentComplaints: departments.map((dept: any) => ({
      name: dept.name,
      complaints: (complaints as any[]).filter((c: any) => c.userId && dept.id).length,
      fill: dept.id % 3 === 0 ? '#46091c' : dept.id % 3 === 1 ? '#400031' : '#10074c'
    })),
    statusData: [
      {
        name: 'Pending',
        value: (complaints as any[]).filter((c: any) => c.status === 'pending').length,
        fill: '#46091c'
      },
      {
        name: 'In Progress',
        value: (complaints as any[]).filter((c: any) => c.status === 'in_progress').length,
        fill: '#400031'
      },
      {
        name: 'Resolved',
        value: (complaints as any[]).filter((c: any) => c.status === 'resolved').length,
        fill: '#10074c'
      },
      {
        name: 'Escalated',
        value: (complaints as any[]).filter((c: any) => c.status === 'escalated').length,
        fill: '#7c2d12'
      }
    ]
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/complaints/${complaintId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
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

  const handleComplaintAction = (action: string, complaintId: number, data?: any) => {
    if (action === 'resolve') {
      updateStatusMutation.mutate({ complaintId, status: 'resolved' });
    } else if (action === 'review') {
      updateStatusMutation.mutate({ complaintId, status: 'in_progress' });
    } else if (action === 'view') {
      setSelectedComplaintId(complaintId);
      setShowDetailsModal(true);
    } else if (action === 'reassign') {
      // For now, just show a toast - could be enhanced with a modal
      toast({
        title: "Reassign Feature",
        description: "Reassignment functionality can be enhanced with a selection modal",
      });
    }
  };

  // Calculate stats from actual complaint data
  const escalatedComplaints = (complaints as Complaint[]).filter((c: Complaint) => 
    c.status === 'escalated' || c.priority === 'urgent'
  );

  const totalComplaints = (complaints as Complaint[]).length;
  const pendingComplaints = (complaints as Complaint[]).filter((c: Complaint) => c.status === 'pending').length;
  const inProgressComplaints = (complaints as Complaint[]).filter((c: Complaint) => c.status === 'in_progress').length;
  const resolvedComplaints = (complaints as Complaint[]).filter((c: Complaint) => c.status === 'resolved').length;
  const escalatedCount = escalatedComplaints.length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

  if (complaintsLoading || announcementsLoading || departmentsLoading) {
    return (
      <div className="min-h-screen dashboard-employee-gradient flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-employee-gradient">
      {/* Modern Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <span className="text-white text-xl font-bold">UH</span>
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold tracking-tight">University Head Dashboard</h1>
                <p className="text-white/70 text-sm font-medium">Welcome back, {user?.name || 'Dr. Fatima Shah'}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              variant="ghost"
              className="text-white hover:bg-white/10 transition-all duration-200 font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/20 backdrop-blur-sm border border-white/30">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white">
              Departments
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white">
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{totalComplaints}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Escalated</p>
                      <p className="text-2xl font-bold text-gray-900">{escalatedCount}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Resolution Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{resolutionRate}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* High Priority & Escalated Complaints */}
              <div className="lg:col-span-2">
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                      <AlertTriangle className="h-6 w-6 mr-3 text-red-600" />
                      High Priority & Escalated Complaints
                      <Badge variant="outline" className="ml-auto">
                        {escalatedComplaints.length} Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {escalatedComplaints.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 bg-green-50 rounded-xl mb-4 inline-block">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                          </div>
                          <p className="text-lg font-medium text-gray-900 mb-2">No escalated complaints</p>
                          <p className="text-sm text-gray-500">All complaints are being handled at department level</p>
                        </div>
                      ) : (
                        escalatedComplaints.map((complaint: Complaint) => (
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

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* University Announcements */}
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                      <span className="p-2 bg-blue-100 rounded-lg mr-3">
                        📢
                      </span>
                      University Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(announcements as Announcement[]).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="p-3 bg-gray-50 rounded-lg mb-3 inline-block">
                            📢
                          </div>
                          <p className="text-sm text-gray-500">No announcements</p>
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

                {/* Quick Actions */}
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                      <RefreshCw className="h-5 w-5 mr-3 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200"
                      onClick={() => setActiveTab("analytics")}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-gray-300 hover:border-gray-400"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Complaints</p>
                      <p className="text-3xl font-bold text-gray-900">{totalComplaints}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Escalated</p>
                      <p className="text-3xl font-bold text-gray-900">{escalatedCount}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Resolution Rate</p>
                      <p className="text-3xl font-bold text-gray-900">{resolutionRate}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Departments</p>
                      <p className="text-3xl font-bold text-gray-900">3</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Bar Chart - Complaints per Department */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                    <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                    Complaints per Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.departmentComplaints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#666"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="complaints" 
                        name="Complaints Count"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart - Complaint Statuses */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                    <PieChartIcon className="h-6 w-6 mr-3 text-purple-600" />
                    Complaint Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pending Review</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingComplaints}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{inProgressComplaints}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{resolvedComplaints}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-8">
            <DepartmentWiseView 
              userRole={user?.role || 'university_head'} 
            />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Announcements</h2>
              <Button
                onClick={() => setShowAnnouncementForm(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(announcements as Announcement[]).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No announcements yet</p>
                        <Button 
                          onClick={() => setShowAnnouncementForm(true)}
                          variant="outline"
                          className="mt-4"
                        >
                          Create First Announcement
                        </Button>
                      </div>
                    ) : (
                      (announcements as Announcement[]).map((announcement: Announcement) => (
                        <AnnouncementCard
                          key={announcement.id}
                          announcement={announcement}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Announcement Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-blue-900">Total Announcements</p>
                        <p className="text-sm text-blue-700">All active announcements</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(announcements as Announcement[]).length}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-green-900">For Students</p>
                        <p className="text-sm text-green-700">Student-targeted announcements</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {(announcements as Announcement[]).filter(a => a.targetRoles?.includes('student')).length}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-purple-900">For Faculty</p>
                        <p className="text-sm text-purple-700">Faculty-targeted announcements</p>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {(announcements as Announcement[]).filter(a => a.targetRoles?.includes('faculty')).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <ComplaintDetailsModal
        complaintId={selectedComplaintId}
        isOpen={showDetailsModal}
        allowReview={true}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedComplaintId(null);
        }}
      />

      <EnhancedAnnouncementForm
        userRole={user?.role || 'university_head'}
        userDepartmentId={user?.departmentId}
        isOpen={showAnnouncementForm}
        onSuccess={() => setShowAnnouncementForm(false)}
        onCancel={() => setShowAnnouncementForm(false)}
      />
    </div>
  );
}