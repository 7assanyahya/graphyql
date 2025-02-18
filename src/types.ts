// types.ts
export interface Transaction {
    id: number;
    amount: number;
    createdAt: string;
    path: string;
  }
  
  export interface Progress {
    id: number;
    grade: number;
    createdAt: string;
    path: string;
  }
  
  export interface Result {
    id: number;
    grade: number;
    createdAt: string;
    path: string;
  }
  
  export interface User {
    id: number;
    login: string;
    transactions: Transaction[];
    progresses: Progress[];
    results: Result[];
  }
  
  export interface GraphQLResponse<T> {
    data: T;
    errors?: Array<{
      message: string;
    }>;
  }
  
  export interface UserProfileResponse {
    user: User;
  }
  
  export interface ProjectDetailsResponse {
    object: {
      id: number;
      name: string;
      type: string;
    };
  }
  
  export interface ProcessedUserData {
    login: string;
    totalXP: number;
    auditRatio: number;
    completedProjects: number;
    xpData: Array<{
      month: string;
      xp: number;
    }>;
    projectStats: Array<{
      name: string;
      value: number;
    }>;
  }
  
  export interface AuthResponse {
    token: string;
  }