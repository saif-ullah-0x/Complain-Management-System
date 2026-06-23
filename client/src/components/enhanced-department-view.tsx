import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getQueryFn } from "@/lib/queryClient";
import ComplaintCard from "./complaint-card";
import { ChevronDown, ChevronRight, Users, FileText, AlertCircle, Building2 } from "lucide-react";
import type { Complaint, FacultyStaff } from "@shared/schema";

interface EnhancedDepartmentViewProps {
  userRole: string;
  userDepartmentId?: number;
}

interface ProgramData {
  name: string;
  faculty: FacultyStaff[];
  complaints: Complaint[];
}

export default function EnhancedDepartmentView({ userRole, userDepartmentId }: EnhancedDepartmentViewProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: faculty = [], isLoading: facultyLoading } = useQuery({
    queryKey: ["/api/faculty", userDepartmentId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userDepartmentId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const toggleProgram = (programName: string) => {
    setExpandedPrograms(prev =>
      prev.includes(programName)
        ? prev.filter(p => p !== programName)
        : [...prev, programName]
    );
  };

  if (complaintsLoading || facultyLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter complaints for the department
  const departmentComplaints = (complaints as Complaint[]).filter(
    (c: Complaint) => 
      userRole === 'university_head' || 
      (userDepartmentId && c.userId && departments.find((d: any) => d.id === userDepartmentId))
  );

  // Group data by programs (using department as program for now)
  const currentDepartment = departments.find((d: any) => d.id === userDepartmentId);
  const programsData: ProgramData[] = currentDepartment ? [
    {
      name: currentDepartment.name,
      faculty: faculty as FacultyStaff[],
      complaints: departmentComplaints
    }
  ] : [];

  // Add sub-programs if available (Computer Science example)
  if (currentDepartment?.name === 'Computer Science') {
    const csPrograms: ProgramData[] = [
      {
        name: 'Software Engineering',
        faculty: (faculty as FacultyStaff[]).slice(0, Math.ceil(faculty.length / 3)),
        complaints: departmentComplaints.filter((c: Complaint) => 
          c.category === 'Academic' || c.description?.toLowerCase().includes('software')
        )
      },
      {
        name: 'Data Science',
        faculty: (faculty as FacultyStaff[]).slice(Math.ceil(faculty.length / 3), Math.ceil(2 * faculty.length / 3)),
        complaints: departmentComplaints.filter((c: Complaint) => 
          c.category === 'Infrastructure' || c.description?.toLowerCase().includes('data')
        )
      },
      {
        name: 'Cybersecurity',
        faculty: (faculty as FacultyStaff[]).slice(Math.ceil(2 * faculty.length / 3)),
        complaints: departmentComplaints.filter((c: Complaint) => 
          c.category === 'Administrative' || c.description?.toLowerCase().includes('security')
        )
      }
    ];
    programsData.splice(0, 1, ...csPrograms);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-[#46091c]" />
        <h2 className="text-xl font-semibold text-gray-900">Department Programs Overview</h2>
      </div>

      {programsData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No program data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {programsData.map((program) => {
            const isExpanded = expandedPrograms.includes(program.name);
            const pendingComplaints = program.complaints.filter(c => c.status === 'pending').length;
            const urgentComplaints = program.complaints.filter(c => c.priority === 'urgent').length;

            return (
              <Card key={program.name} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleProgram(program.name)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-[#46091c]" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-[#46091c]" />
                          )}
                          <Building2 className="w-5 h-5 text-[#46091c]" />
                          {program.name}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {program.faculty.length} Faculty
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {program.complaints.length} Complaints
                            </span>
                          </div>
                          {urgentComplaints > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {urgentComplaints} Urgent
                            </Badge>
                          )}
                          {pendingComplaints > 0 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {pendingComplaints} Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Faculty Section */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Faculty Members
                          </h4>
                          <div className="space-y-2">
                            {program.faculty.length === 0 ? (
                              <p className="text-sm text-gray-500">No faculty assigned</p>
                            ) : (
                              program.faculty.map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-gray-900">{f.rollNoOrId}</p>
                                    <p className="text-sm text-gray-600">Faculty Member</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                      {program.complaints.filter(c => c.assignedTo === f.id).length} assigned
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Complaints Section */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Recent Complaints
                          </h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {program.complaints.length === 0 ? (
                              <p className="text-sm text-gray-500">No complaints</p>
                            ) : (
                              program.complaints.slice(0, 5).map((complaint: Complaint) => (
                                <div key={complaint.id} className="p-3 border rounded-lg bg-white">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm">
                                      {complaint.title || complaint.category}
                                    </h5>
                                    <div className="flex gap-2">
                                      <Badge className={getStatusColor(complaint.status)}>
                                        {complaint.status}
                                      </Badge>
                                      <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                                        {complaint.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {complaint.description}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}