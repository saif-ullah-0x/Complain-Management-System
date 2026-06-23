import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Send, X, FileText } from "lucide-react";

interface ModernComplaintModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ModernComplaintModal({ isOpen, onSuccess, onCancel }: ModernComplaintModalProps) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    priority: "medium",
    isAnonymous: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/complaints", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });
      setFormData({
        title: "",
        category: "",
        description: "",
        priority: "medium",
        isAnonymous: false,
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
    if (!formData.category || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      title: "",
      category: "",
      description: "",
      priority: "medium",
      isAnonymous: false,
    });
    onCancel();
  };

  // Determine gradient based on user role
  const getGradientClass = () => {
    if (user?.role === 'student') {
      return 'bg-gradient-to-br from-[#2e265e] via-[#2c5555] to-[#2b6751]';
    } else {
      return 'bg-gradient-to-br from-[#46091c] via-[#400031] to-[#10074c]';
    }
  };

  const getButtonGradient = () => {
    if (user?.role === 'student') {
      return 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700';
    } else {
      return 'bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Modal Header with Gradient */}
        <div className={`${getGradientClass()} px-8 py-10 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold flex items-center mb-2">
                <FileText className="h-8 w-8 mr-4" />
                Submit New Complaint
              </DialogTitle>
              <p className="text-white/90 text-lg">
                Describe your concern and we'll ensure it's addressed properly
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
              <Label htmlFor="category" className="text-sm font-semibold text-gray-800 flex items-center">
                Category *
                <span className="ml-2 text-red-500">•</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-gray-200">
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="priority" className="text-sm font-semibold text-gray-800">
                Priority Level
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-gray-200">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-800 flex items-center">
                Description *
                <span className="ml-2 text-red-500">•</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your complaint in detail..."
                rows={6}
                className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl resize-none transition-all duration-200"
                required
              />
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: !!checked })}
                className="border-2 border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="flex-1">
                <Label htmlFor="anonymous" className="text-sm font-medium text-gray-800 cursor-pointer">
                  Submit anonymously
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Your identity will be kept confidential
                </p>
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
                  {submitMutation.isPending ? "Submitting..." : "Submit Complaint"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}