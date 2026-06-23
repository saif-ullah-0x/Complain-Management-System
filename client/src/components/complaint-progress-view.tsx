import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQueryFn } from "@/lib/queryClient";
import { CheckCircle, Clock, User, AlertTriangle, FileText } from "lucide-react";
import type { AuditLog } from "@shared/schema";

interface ComplaintProgressViewProps {
  complaintId: number;
  currentStatus: string;
}

export default function ComplaintProgressView({ complaintId, currentStatus }: ComplaintProgressViewProps) {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/complaints", complaintId, "audit"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!complaintId,
  });

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return 'Pending';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return 'Pending';
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Process audit logs to create step-by-step progress
  const logs = auditLogs as any[];
  const submittedLog = logs.find(log => log.actionType === 'created');
  const reviewedLog = logs.find(log => log.actionType === 'reviewed');
  const assignedLog = logs.find(log => log.actionType === 'assigned');
  const escalatedLog = logs.find(log => log.actionType === 'escalated');
  const resolvedLog = logs.find(log => log.actionType === 'status_updated' && log.actionDetails?.includes('resolved'));

  const steps = [
    {
      id: 1,
      title: "Complaint Submitted",
      description: "Initial complaint submission",
      timestamp: submittedLog?.timestamp,
      completed: !!submittedLog,
      icon: FileText,
      color: "blue"
    },
    {
      id: 2,
      title: "Reviewed by Dept Head",
      description: reviewedLog?.actionDetails || "Pending review by department head",
      timestamp: reviewedLog?.timestamp,
      completed: !!reviewedLog,
      icon: User,
      color: "purple"
    },
    {
      id: 3,
      title: "Assigned to Faculty",
      description: assignedLog?.actionDetails || "Awaiting assignment to faculty member",
      timestamp: assignedLog?.timestamp,
      completed: !!assignedLog,
      icon: User,
      color: "orange"
    },
    {
      id: 4,
      title: "Escalated to University Head",
      description: escalatedLog?.actionDetails || "No escalation required",
      timestamp: escalatedLog?.timestamp,
      completed: !!escalatedLog,
      icon: AlertTriangle,
      color: "red",
      optional: true
    },
    {
      id: 5,
      title: "Resolved",
      description: resolvedLog?.actionDetails || "Resolution pending",
      timestamp: resolvedLog?.timestamp,
      completed: currentStatus === 'resolved',
      icon: CheckCircle,
      color: "green"
    }
  ];

  const getStepStatus = (step: any, index: number) => {
    if (step.completed) return 'completed';
    if (step.optional && !step.completed) return 'optional';
    
    // Check if this is the current active step
    const previousStep = steps[index - 1];
    if (!previousStep || previousStep.completed) return 'active';
    
    return 'pending';
  };

  const getIconColor = (status: string, color: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'active':
        return `text-${color}-600 bg-${color}-100`;
      case 'optional':
        return 'text-gray-400 bg-gray-100';
      default:
        return 'text-gray-400 bg-gray-100';
    }
  };

  const getLineColor = (currentStatus: string, nextStatus: string) => {
    if (currentStatus === 'completed' && nextStatus === 'completed') {
      return 'bg-green-500';
    } else if (currentStatus === 'completed') {
      return 'bg-gradient-to-b from-green-500 to-gray-300';
    }
    return 'bg-gray-300';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-bold text-gray-900">
          <Clock className="h-5 w-5 mr-3 text-blue-600" />
          Progress Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index);
            const IconComponent = step.icon;
            const isLast = index === steps.length - 1;
            const nextStep = steps[index + 1];
            const nextStatus = nextStep ? getStepStatus(nextStep, index + 1) : 'pending';

            return (
              <div key={step.id} className="relative flex items-start pb-8">
                {/* Connecting Line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 -ml-px">
                    <div className={`h-full w-full ${getLineColor(status, nextStatus)}`}></div>
                  </div>
                )}

                {/* Step Icon */}
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  status === 'completed' ? 'border-green-500' : 
                  status === 'active' ? `border-${step.color}-500` : 'border-gray-300'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(status, step.color)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                </div>

                {/* Step Content */}
                <div className="ml-6 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-semibold ${
                      status === 'completed' ? 'text-green-700' :
                      status === 'active' ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    {status === 'completed' && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Completed
                      </Badge>
                    )}
                    {status === 'active' && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        In Progress
                      </Badge>
                    )}
                    {step.optional && !step.completed && (
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    status === 'completed' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(step.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}