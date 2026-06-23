import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Send, X, Megaphone } from "lucide-react";

interface AnnouncementFormProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AnnouncementForm({ isOpen, onSuccess, onCancel }: AnnouncementFormProps) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    message: "",
    targetRoles: [] as string[],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      setFormData({
        message: "",
        targetRoles: [],
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter an announcement message",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetRoles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one target role",
        variant: "destructive",
      });
      return;
    }

    // Submit announcement for each selected role
    formData.targetRoles.forEach(role => {
      submitMutation.mutate({
        message: formData.message,
        role: role
      });
    });
  };

  const handleClose = () => {
    setFormData({
      message: "",
      targetRoles: [],
    });
    onCancel();
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: checked 
        ? [...prev.targetRoles, role]
        : prev.targetRoles.filter(r => r !== role)
    }));
  };

  // Define available roles based on user's role
  const getAvailableRoles = () => {
    switch (user?.role) {
      case 'university_head':
        return [
          { value: 'all', label: 'All Users' },
          { value: 'student', label: 'Students' },
          { value: 'faculty', label: 'Faculty' },
          { value: 'dept_head', label: 'Department Heads' }
        ];
      case 'dept_head':
        return [
          { value: 'faculty', label: 'Faculty in Department' },
          { value: 'student', label: 'Students in Department' }
        ];
      case 'faculty':
        return [
          { value: 'student', label: 'Students in Courses' }
        ];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  // Determine gradient based on user role
  const getGradientClass = () => {
    return 'bg-gradient-to-br from-[#46091c] via-[#400031] to-[#10074c]';
  };

  const getButtonGradient = () => {
    return 'bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700';
  };

  if (!user || !['university_head', 'dept_head', 'faculty'].includes(user.role)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Modal Header with Gradient */}
        <div className={`${getGradientClass()} px-8 py-10 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold flex items-center mb-2">
                <Megaphone className="h-8 w-8 mr-4" />
                Create Announcement
              </DialogTitle>
              <p className="text-white/90 text-lg">
                Share important information with your audience
              </p>
            </DialogHeader>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Form Content with Scrolling */}
        <div className="p-8 bg-white overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-semibold text-gray-800 flex items-center">
                Message *
                <span className="ml-2 text-red-500">•</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your announcement message..."
                rows={6}
                className="border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl resize-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-800 flex items-center">
                Target Audience *
                <span className="ml-2 text-red-500">•</span>
              </Label>
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <div key={role.value} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <Checkbox
                      id={role.value}
                      checked={formData.targetRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                      className="border-2 border-gray-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <div className="flex-1">
                      <Label htmlFor={role.value} className="text-sm font-medium text-gray-800 cursor-pointer">
                        {role.label}
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        {role.value === 'all' ? 'Send to all users in the system' :
                         role.value === 'student' ? 'Send to all students' :
                         role.value === 'faculty' ? 'Send to faculty members' :
                         role.value === 'dept_head' ? 'Send to department heads' :
                         'Send to selected group'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200"
                disabled={submitMutation.isPending}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                className={`flex items-center space-x-2 px-8 py-3 ${getButtonGradient()} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <Send className="h-4 w-4" />
                <span>
                  {submitMutation.isPending ? "Publishing..." : "Publish Announcement"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}