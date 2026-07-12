export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  login?: string;
  role: 'admin' | 'manager' | 'baker' | 'client';
  position: string;
  department: string;
  hireDate: string;  // ← camelCase
  salary: number;
  status: 'active' | 'inactive' | 'on_vacation';
  avatar?: string;
  address?: string;
  birthDate?: string;  // ← camelCase
  emergencyContact?: string;  // ← camelCase
  emergencyPhone?: string;  // ← camelCase
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  onVacation: number;
  inactive: number;
  avgSalary: number;
  departments: { name: string; count: number }[];
}

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  login?: string;
  password?: string;
  role: 'admin' | 'manager' | 'baker' | 'client';
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_vacation';
  address?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}