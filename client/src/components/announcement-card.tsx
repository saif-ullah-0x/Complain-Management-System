import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@shared/schema";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const formatDate = (date: Date | string) => {
    const now = new Date();
    const announcementDate = typeof date === 'string' ? new Date(date) : date;
    const diffTime = Math.abs(now.getTime() - announcementDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return announcementDate.toLocaleDateString();
    }
  };

  const getAnnouncementIcon = (targetRoles: string[]) => {
    if (!targetRoles || targetRoles.length === 0) return 'info';
    if (targetRoles.includes('university_head')) return 'account_balance';
    if (targetRoles.includes('dept_head')) return 'domain';
    if (targetRoles.includes('faculty')) return 'school';
    if (targetRoles.includes('student')) return 'school';
    return 'info';
  };

  const getAnnouncementColor = (targetRoles: string[]) => {
    if (!targetRoles || targetRoles.length === 0) return 'border-gray-500';
    if (targetRoles.includes('university_head')) return 'border-purple-500';
    if (targetRoles.includes('dept_head')) return 'border-blue-500';
    if (targetRoles.includes('faculty')) return 'border-green-500';
    if (targetRoles.includes('student')) return 'border-orange-500';
    return 'border-gray-500';
  };

  return (
    <Card className={`border-l-4 ${getAnnouncementColor(announcement.targetRoles || [])} bg-gray-50 hover:bg-gray-100 transition-colors`}>
      <CardContent className="p-4">
        <div className="flex items-start">
          <span className={`material-icons text-gray-600 mr-3 mt-0.5`}>
            {getAnnouncementIcon(announcement.targetRoles || [])}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">
                System Announcement
              </h4>
              <Badge variant="outline" className="text-xs">
                {announcement.targetRoles && announcement.targetRoles.length > 0 
                  ? announcement.targetRoles.map(role => role.replace('_', ' ')).join(', ')
                  : 'General'
                }
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              {announcement.message}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(announcement.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
