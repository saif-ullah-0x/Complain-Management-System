import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Complaint } from "@shared/schema";

interface ComplaintCardProps {
  complaint: Complaint;
  showActions?: boolean;
  onAction?: (action: string, complaintId: number, data?: any) => void;
  userRole?: string;
  assignedUserName?: string;
}

export default function ComplaintCard({ complaint, showActions = false, onAction, userRole, assignedUserName }: ComplaintCardProps) {
  const getStatusProgress = (status: string | undefined | null) => {
    if (!status) return 25; // Default to pending progress
    switch (status) {
      case 'pending':
        return 25;
      case 'in_progress':
        return 60;
      case 'resolved':
        return 100;
      case 'escalated':
        return 75;
      default:
        return 25;
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'; // Default for pending
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined | null) => {
    if (!priority) return 'bg-gray-100 text-gray-800'; // Default for medium
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return 'Invalid Date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const progress = getStatusProgress(complaint.status);

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Badge variant="outline">
                CMP-{complaint.id?.toString().padStart(3, '0') || '000'}
              </Badge>
              <Badge className={getPriorityColor(complaint.priority)}>
                {complaint.priority}
              </Badge>
              <Badge variant="secondary">
                {complaint.category}
              </Badge>
              {complaint.isAnonymous && (
                <Badge variant="outline" className="text-xs">
                  Anonymous
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-gray-900 mb-1">
              {complaint.category ? 
                complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1) + ' Issue' : 
                'General Issue'
              }
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {complaint.description}
            </p>
          </div>
          <div className="text-right ml-4">
            <Badge className={getStatusColor(complaint.status)}>
              {complaint.status ? complaint.status.replace('_', ' ') : 'pending'}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Assignment Information */}
        {complaint.assignedTo && (
          <div className="bg-blue-50 p-2 rounded-md mb-3">
            <div className="flex items-center text-sm text-blue-800">
              <span className="material-icons text-sm mr-1">person</span>
              <span>Assigned to: {assignedUserName || `User #${complaint.assignedTo}`}</span>
            </div>
            {complaint.assignedAt && (
              <div className="text-xs text-blue-600 mt-1">
                Assigned: {formatDate(complaint.assignedAt)}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Submitted: {formatDate(complaint.createdAt)}
          </span>
          
          {showActions && onAction && (
            <div className="flex space-x-2 flex-wrap">
              {/* Preview button - available to all roles */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('view', complaint.id)}
              >
                <span className="material-icons text-sm mr-1">visibility</span>
                Preview
              </Button>
              
              {/* Student Actions - Only Preview */}
              {userRole === 'student' && (
                // Student only gets Preview button (already shown above)
                <></>
              )}
              
              {/* Faculty Actions - Preview and Resolve (for assigned complaints) */}
              {userRole === 'faculty' && complaint.assignedTo && complaint.status !== 'resolved' && (
                <Button
                  size="sm"
                  onClick={() => onAction('resolve', complaint.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <span className="material-icons text-sm mr-1">check_circle</span>
                  Resolve
                </Button>
              )}
              
              {/* Department Head Actions - Preview, Assign, Escalate */}
              {userRole === 'dept_head' && complaint.status !== 'resolved' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('assign', complaint.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="material-icons text-sm mr-1">assignment_ind</span>
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAction('escalate', complaint.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <span className="material-icons text-sm mr-1">trending_up</span>
                    Escalate
                  </Button>
                </>
              )}
              
              {/* University Head Actions - Preview, Assign/Reassign, Resolve */}
              {userRole === 'university_head' && complaint.status !== 'resolved' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('assign', complaint.id)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <span className="material-icons text-sm mr-1">assignment</span>
                    {complaint.assignedTo ? 'Reassign' : 'Assign'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAction('resolve', complaint.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <span className="material-icons text-sm mr-1">check_circle</span>
                    Resolve
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
