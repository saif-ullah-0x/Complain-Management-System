import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getQueryFn } from "@/lib/queryClient";
import { ChevronDown, ChevronRight, Users, FileText, Building } from "lucide-react";
import type { Complaint, Department } from "@shared/schema";

interface DepartmentWiseViewProps {
  userRole: string;
  userDepartmentId?: number;
}

export default function DepartmentWiseView({ userRole, userDepartmentId }: DepartmentWiseViewProps) {
  const [expandedDepartments, setExpandedDepartments] = useState<number[]>([]);

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: faculty = [], isLoading: facultyLoading } = useQuery({
    queryKey: ["/api/faculty", userDepartmentId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userDepartmentId && userRole === 'dept_head',
  });

  const toggleDepartment = (deptId: number) => {
    setExpandedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const getDepartmentComplaints = (deptId: number) => {
    return (complaints as any[]).filter((complaint: any) => {
      // For now, we'll associate complaints with departments based on user's department
      // In a real system, you'd have a proper department-complaint relationship
      return complaint.userId && deptId;
    });
  };

  const getDepartmentFaculty = (deptId: number) => {
    if (userRole === 'dept_head' && deptId === userDepartmentId) {
      return faculty as any[];
    }
    return []; // For university head, you'd fetch faculty for each department
  };

  // Filter departments based on user role
  const filteredDepartments = userRole === 'dept_head' 
    ? (departments as any[]).filter((dept: any) => dept.id === userDepartmentId)
    : departments as any[];

  if (departmentsLoading || complaintsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Building className="h-6 w-6 mr-3" />
          {userRole === 'dept_head' ? 'Department Overview' : 'University Departments'}
        </h2>
        <Badge className="bg-white/20 text-white border-white/30">
          {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {filteredDepartments.map((department: any) => {
          const deptComplaints = getDepartmentComplaints(department.id);
          const deptFaculty = getDepartmentFaculty(department.id);
          const isExpanded = expandedDepartments.includes(department.id);

          return (
            <Card key={department.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <Collapsible open={isExpanded} onOpenChange={() => toggleDepartment(department.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                          <p className="text-sm text-gray-600">Department ID: {department.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {deptComplaints.length} Complaints
                          </Badge>
                          {userRole === 'dept_head' && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {deptFaculty.length} Faculty
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Faculty List */}
                      {userRole === 'dept_head' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Faculty Members
                          </h4>
                          {deptFaculty.length === 0 ? (
                            <p className="text-gray-500 text-sm">No faculty members assigned</p>
                          ) : (
                            <div className="space-y-2">
                              {deptFaculty.map((member: any) => (
                                <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
                                  <p className="font-medium text-gray-900">{member.rollNoOrId}</p>
                                  <p className="text-sm text-gray-600">Faculty ID: {member.id}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Department Complaints */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Recent Complaints
                        </h4>
                        {deptComplaints.length === 0 ? (
                          <p className="text-gray-500 text-sm">No complaints for this department</p>
                        ) : (
                          <div className="space-y-2">
                            {deptComplaints.slice(0, 3).map((complaint: any) => (
                              <div key={complaint.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {complaint.title || complaint.category}
                                  </p>
                                  <Badge 
                                    className={
                                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {complaint.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  Priority: {complaint.priority} • ID: {complaint.id}
                                </p>
                              </div>
                            ))}
                            {deptComplaints.length > 3 && (
                              <p className="text-xs text-gray-500 text-center pt-2">
                                +{deptComplaints.length - 3} more complaints
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}