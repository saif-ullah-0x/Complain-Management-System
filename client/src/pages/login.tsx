import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";

type LoginMode = 'student' | 'employee';
type EmployeeRole = 'faculty' | 'dept_head' | 'university_head';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginMode, setLoginMode] = useState<LoginMode>('student');
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>('faculty');
  const [credentials, setCredentials] = useState({
    rollNoOrId: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      
      // Navigate to the appropriate dashboard based on user role
      switch (data.user.role) {
        case 'student':
          setLocation("/student");
          break;
        case 'faculty':
          setLocation("/faculty");
          break;
        case 'dept_head':
          setLocation("/dept-head");
          break;
        case 'university_head':
          setLocation("/university-head");
          break;
        default:
          setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleLoginMode = () => {
    setLoginMode(loginMode === 'student' ? 'employee' : 'student');
    setCredentials({ rollNoOrId: '', password: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.rollNoOrId || !credentials.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(credentials);
  };

  const getDefaultCredentials = () => {
    if (loginMode === 'student') {
      return { rollNoOrId: 'F23-1686', password: '34567' };
    }
    
    switch (selectedRole) {
      case 'faculty':
        return { rollNoOrId: 'faculty1', password: '54321' };
      case 'dept_head':
        return { rollNoOrId: 'depthead1', password: '54321' };
      case 'university_head':
        return { rollNoOrId: 'admin1', password: '76543' };
      default:
        return { rollNoOrId: '', password: '' };
    }
  };

  const defaultCreds = getDefaultCredentials();

  return (
    <div className="relative">
      <div className={`transition-all duration-500 ${loginMode === 'student' ? 'student-gradient' : 'employee-gradient'}`} />
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">UH</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-white text-xl font-semibold">
                    {loginMode === 'student' ? 'STUDENT' : 'EMPLOYEE'}
                  </h1>
                  <h2 className="text-white text-lg">
                    {loginMode === 'student' ? 'INFORMATION' : 'INFORMATION'}
                  </h2>
                  <h3 className="text-white text-lg font-semibold">SYSTEM</h3>
                </div>
              </div>
              <Button
                onClick={toggleLoginMode}
                variant="ghost"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-medium"
              >
                <span className="material-icons mr-2">
                  {loginMode === 'student' ? 'admin_panel_settings' : 'person'}
                </span>
                {loginMode === 'student' ? 'Faculty Login' : 'Student Login'}
              </Button>
            </div>
          </div>
        </header>

        {/* Login Form */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <Card className="w-full max-w-md card-shadow-lg fade-in bg-white" style={{ width: '500px', minHeight: '320px' }}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {loginMode === 'student' ? 'Login' : 'Employee Portal Login'}
              </h2>
              <p className="text-gray-600">
                {loginMode === 'student' ? '' : 'Sign in to start your session'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection for Employee Login */}
              {loginMode === 'employee' && (
                <div>
                  <Label htmlFor="role">Select Role</Label>
                  <Select value={selectedRole} onValueChange={(value: EmployeeRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="dept_head">Department Head</SelectItem>
                      <SelectItem value="university_head">University Head/VC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Username Field */}
              <div>
                <div className="relative">
                  <Input
                    id="rollNoOrId"
                    type="text"
                    value={credentials.rollNoOrId}
                    onChange={(e) => setCredentials({ ...credentials, rollNoOrId: e.target.value })}
                    placeholder={loginMode === 'student' ? 'xxx-xxxx' : 'Username'}
                    className="pl-12 h-12 text-base"
                  />
                  <span className="material-icons absolute left-4 top-3 text-gray-400">
                    {loginMode === 'student' ? 'person' : 'email'}
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Password"
                    className="pl-12 h-12 text-base"
                  />
                  <span className="material-icons absolute left-4 top-3 text-gray-400">lock</span>
                </div>
              </div>

              {/* Default Credentials */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Default Test Credentials:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">
                      {loginMode === 'student' ? 'Roll No:' : 'ID:'}
                    </span> {defaultCreds.rollNoOrId}
                  </div>
                  <div>
                    <span className="font-medium">Password:</span> {defaultCreds.password}
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className={`w-full h-12 text-white font-semibold text-base ${
                  loginMode === 'student' 
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Logging in...
                  </div>
                ) : (
                  loginMode === 'student' ? 'Login' : 'Submit'
                )}
              </Button>
              
              {/* Additional links for employee portal */}
              {loginMode === 'employee' && (
                <div className="text-center text-sm text-gray-600 mt-4">
                  <span>forgot your password? </span>
                  <a href="#" className="text-blue-600 hover:underline">
                    [Contact Administrator]
                  </a>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
