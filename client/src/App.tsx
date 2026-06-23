import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import StudentDashboard from "@/pages/student-dashboard";
import FacultyDashboard from "@/pages/faculty-dashboard";
import DeptHeadDashboard from "@/pages/dept-head-dashboard";
import UniversityHeadDashboard from "@/pages/university-head-dashboard";
import NotFound from "@/pages/not-found";
import { useUser } from "@/hooks/use-user";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin">refresh</span>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      </Route>
      <Route path="/student">
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty">
        <ProtectedRoute requiredRole="faculty">
          <FacultyDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dept-head">
        <ProtectedRoute requiredRole="dept_head">
          <DeptHeadDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/university-head">
        <ProtectedRoute requiredRole="university_head">
          <UniversityHeadDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardRouter() {
  const { data: user } = useUser();

  if (!user) return <Login />;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'dept_head':
      return <DeptHeadDashboard />;
    case 'university_head':
      return <UniversityHeadDashboard />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
