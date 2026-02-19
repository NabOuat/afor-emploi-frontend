export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: 'CDI' | 'CDD' | 'Stage' | 'Freelance';
  experience: string;
  skills: string[];
  postedDate: string;
  deadline?: string;
  companyLogo?: string;
  applicants?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience?: number;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'interview';
  appliedDate: string;
  message?: string;
}

export interface SearchFilters {
  keyword?: string;
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
}
