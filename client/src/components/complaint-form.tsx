import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";

interface ComplaintFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const getCategoriesByRole = (role: string) => {
  switch (role) {
    case 'student':
      return [
        'Academic', 'Infrastructure', 'Administrative', 'Library', 
        'Hostel/Accommodation', 'Transportation', 'Fee Related', 'Examination'
      ];
    case 'faculty':
      return [
        'Administrative Support', 'Resource Management', 'Technology/IT', 
        'Facility Issues', 'Policy Concerns', 'Student Relations', 'Research Support'
      ];
    case 'dept_head':
      return [
        'Budget/Financial', 'Staff Management', 'Resource Allocation', 
        'Policy Implementation', 'Inter-departmental', 'Infrastructure'
      ];
    case 'university_head':
      return [
        'Strategic Planning', 'Budget/Financial', 'Policy Review', 
        'External Relations', 'Quality Assurance', 'Compliance'
      ];
    default:
      return ['Academic', 'Infrastructure', 'Administrative'];
  }
};

export default function ComplaintForm({ onSuccess, onCancel }: ComplaintFormProps) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    priority: 'medium',
    isAnonymous: false,
  });

  const categories = getCategoriesByRole(user?.role || 'student');

  const submitComplaintMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/complaints', data);
    },
    onSuccess: () => {
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
    
    if (!formData.title || !formData.category || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitComplaintMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Brief title for your complaint"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority Level</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          rows={5}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your complaint in detail..."
          className="resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={formData.isAnonymous}
            onCheckedChange={(checked) => handleInputChange('isAnonymous', checked)}
          />
          <Label htmlFor="anonymous" className="text-sm">
            Submit anonymously
          </Label>
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitComplaintMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitComplaintMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {submitComplaintMutation.isPending ? (
              <div className="flex items-center">
                <span className="material-icons animate-spin mr-2">refresh</span>
                Submitting...
              </div>
            ) : (
              'Submit Complaint'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
