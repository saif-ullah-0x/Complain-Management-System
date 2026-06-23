import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Calendar, User, Clock, FileText, AlertTriangle, CheckCircle, Eye, X } from "lucide-react";
import type { Complaint, AuditLog } from "@shared/schema";

interface ComplaintDetailsModalProps {
  complaintId: number | null;
  isOpen: boolean;
  onClose: () => void;
  allowReview?: boolean;
}

export default function ComplaintDetailsModal({ complaintId, isOpen, onClose, allowReview = false }: ComplaintDetailsModalProps) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [isReviewing, setIsReviewing] = useState(false);

  const { data: complaint } = useQuery({
    queryKey: ["/api/complaints", complaintId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!complaintId && isOpen,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/complaints", complaintId, "audit"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!complaintId && isOpen,
  });

  const reviewMutation = useMutation({
    mutationFn: async (complaintId: number) => {
      const reviewAction = user?.role === 'dept_head' ? 'Reviewed by Dept Head' : 'Reviewed by University Head';
      return await apiRequest("POST", `/api/complaints/${complaintId}/audit`, {
        actionType: 'reviewed',
        actionDetails: reviewAction
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints", complaintId, "audit"] });
      toast({
        title: "Success",
        description: "Complaint marked as reviewed",
      });
      setIsReviewing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsReviewing(false);
    },
  });

  const handleReview = () => {
    if (complaintId) {
      setIsReviewing(true);
      reviewMutation.mutate(complaintId);
    }
  };

  if (!complaint) return null;

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return 'Invalid Date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string | undefined | null) => {
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'assigned':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'status_updated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Determine gradient based on user role and review capability
  const getGradientClass = () => {
    if (allowReview && (user?.role === 'dept_head' || user?.role === 'university_head')) {
      return 'bg-gradient-to-br from-[#46091c] via-[#400031] to-[#10074c]';
    } else {
      return 'bg-gradient-to-br from-[#2e265e] via-[#2c5555] to-[#2b6751]';
    }
  };

  const getButtonGradient = () => {
    if (allowReview && (user?.role === 'dept_head' || user?.role === 'university_head')) {
      return 'bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700';
    } else {
      return 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Modal Header with Gradient */}
        <div className={`${getGradientClass()} px-8 py-6 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                <Eye className="h-6 w-6" />
                <span>Complaint Details</span>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  CMP-{(complaint as any).id?.toString().padStart(3, '0') || '000'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
        </div>

        {/* Content with Scrolling */}
        <div className="p-8 bg-white overflow-y-auto max-h-[calc(90vh-150px)]">
          <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
                <Badge variant="secondary" className="text-sm">
                  {(complaint as any).category}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Priority</h3>
                <Badge className={getPriorityColor((complaint as any).priority)}>
                  {(complaint as any).priority}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <Badge className={getStatusColor((complaint as any).status)}>
                  {(complaint as any).status?.replace('_', ' ') || 'pending'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Submitted</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(complaint.createdAt)}
                </div>
              </div>

              {complaint.assignedTo && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Assigned To</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    User #{complaint.assignedTo}
                  </div>
                  {complaint.assignedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Assigned on: {formatDate(complaint.assignedAt)}
                    </div>
                  )}
                </div>
              )}

              {complaint.isAnonymous && (
                <div>
                  <Badge variant="outline" className="text-xs">
                    Anonymous Submission
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {complaint.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Audit History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Activity History</h3>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No activity history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.actionType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Action'}
                      </p>
                      {log.actionDetails && (
                        <p className="text-sm text-gray-600">
                          {log.actionDetails}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(log.createdAt)} • By User #{log.actionBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {allowReview && (user?.role === 'dept_head' || user?.role === 'university_head') && (
              <Button
                onClick={handleReview}
                disabled={isReviewing}
                className={`flex items-center space-x-2 px-6 py-2 ${getButtonGradient()} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                <Eye className="h-4 w-4" />
                <span>
                  {isReviewing ? "Marking as Reviewed..." : "Mark as Reviewed"}
                </span>
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
              <X className="h-4 w-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}