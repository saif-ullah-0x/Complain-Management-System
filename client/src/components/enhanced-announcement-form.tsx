import { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Users, Building } from "lucide-react";

interface EnhancedAnnouncementFormProps {
  userRole: string;
  userDepartmentId?: number;
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EnhancedAnnouncementForm({ 
  userRole, 
  userDepartmentId, 
  isOpen, 
  onSuccess, 
  onCancel 
}: EnhancedAnnouncementFormProps) {
  const [message, setMessage] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get departments for university head
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    enabled: userRole === 'university_head'
  });

  // Define available target roles based on user role
  const getAvailableRoles = () => {
    switch (userRole) {
      case 'university_head':
        return [
          { id: 'student', label: 'Students', icon: '👥' },
          { id: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
          { id: 'dept_head', label: 'Department Heads', icon: '👔' }
        ];
      case 'dept_head':
        return [
          { id: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
          { id: 'student', label: 'Students', icon: '👥' }
        ];
      case 'faculty':
        return [
          { id: 'student', label: 'Students', icon: '👥' }
        ];
      default:
        return [];
    }
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { message: string; targetRoles: string[]; departmentId?: number | null }) =>
      apiRequest("POST", "/api/announcements", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setMessage("");
      setTargetRoles([]);
      setSelectedDepartmentId(null);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter an announcement message",
        variant: "destructive",
      });
      return;
    }

    if (targetRoles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one target role",
        variant: "destructive",
      });
      return;
    }

    const departmentId = userRole === 'university_head' ? selectedDepartmentId : userDepartmentId;

    createAnnouncementMutation.mutate({
      message: message.trim(),
      targetRoles,
      departmentId
    });
  }, [message, targetRoles, userRole, selectedDepartmentId, userDepartmentId, createAnnouncementMutation, toast]);

  const handleRoleToggle = (roleId: string) => {
    setTargetRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Create New Announcement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message">Announcement Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Target Audience
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {availableRoles.map((role) => (
                <div key={role.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={role.id}
                    checked={targetRoles.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <Label 
                    htmlFor={role.id} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span>{role.icon}</span>
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {userRole === 'university_head' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Department Scope
              </Label>
              <Select 
                value={selectedDepartmentId?.toString() || "university"} 
                onValueChange={(value) => setSelectedDepartmentId(value === "university" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University-wide</SelectItem>
                  {(departments as any[])?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">
                <p><strong>From:</strong> {userRole.replace('_', ' ').toUpperCase()}</p>
                <p><strong>To:</strong> {targetRoles.length > 0 ? targetRoles.join(', ') : 'No roles selected'}</p>
                <p><strong>Scope:</strong> {
                  userRole === 'university_head' 
                    ? (selectedDepartmentId ? (departments as any[])?.find((d: any) => d.id === selectedDepartmentId)?.name || 'Department' : 'University-wide')
                    : 'Department-specific'
                }</p>
                <div className="mt-2 p-2 bg-white rounded border">
                  {message || "Your announcement message will appear here..."}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAnnouncementMutation.isPending}
              className="bg-[#46091c] hover:bg-[#10074c] text-white"
            >
              {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}