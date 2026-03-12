// Brigzy - Job & Gig Marketplace Types

export type UserRole = 'worker' | 'employer';

export type JobCategory =
  | 'hospitality'
  | 'retail'
  | 'delivery'
  | 'construction'
  | 'events'
  | 'cleaning'
  | 'moving'
  | 'admin'
  | 'other';

export type SalaryType = 'hourly' | 'fixed';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  avatar?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  role: UserRole;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  companyLogo?: string;
  location: string;
  salaryType: SalaryType;
  salaryAmount: number;
  salaryCurrency: string;
  duration: string;
  category: JobCategory;
  postedAt: string;
  employerId: string;
  applicantsCount: number;
  isUrgent?: boolean;
  requirements?: string[];
  requiresIntroduction?: boolean;
  // Localized fields
  title_sk?: string;
  description_sk?: string;
  location_sk?: string;
  duration_sk?: string;
  requirements_sk?: string[];
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  appliedAt: string;
  message?: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  jobId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  jobId?: string;
  lastMessage?: Message;
  updatedAt: string;
}

// Category metadata
export const JOB_CATEGORIES = [
  { id: 'hospitality' as JobCategory, name: 'Hospitality', name_sk: 'Pohostinstvo', icon: '🍽️' },
  { id: 'retail' as JobCategory, name: 'Retail', name_sk: 'Maloobchod', icon: '🛍️' },
  { id: 'delivery' as JobCategory, name: 'Delivery', name_sk: 'Doručovanie', icon: '🚚' },
  { id: 'construction' as JobCategory, name: 'Construction', name_sk: 'Stavebníctvo', icon: '🏗️' },
  { id: 'events' as JobCategory, name: 'Events', name_sk: 'Eventy', icon: '🎉' },
  { id: 'cleaning' as JobCategory, name: 'Cleaning', name_sk: 'Upratovanie', icon: '✨' },
  { id: 'moving' as JobCategory, name: 'Moving', name_sk: 'Sťahovanie', icon: '📦' },
  { id: 'admin' as JobCategory, name: 'Admin', name_sk: 'Administratíva', icon: '💼' },
  { id: 'other' as JobCategory, name: 'Other', name_sk: 'Iné', icon: '📋' },
];

