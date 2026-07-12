import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../data/services/employee.service';
import { Employee, EmployeeStats, EmployeeFormData } from '../../data/interfaces/employee.interface';

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employees-page.html',
  styleUrls: ['./employees-page.scss']
})
export class EmployeesPage implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  stats: EmployeeStats = {
    total: 0,
    active: 0,
    onVacation: 0,
    inactive: 0,
    avgSalary: 0,
    departments: []
  };
  
  loading = true;
  searchQuery = '';
  selectedRole: string = 'all';
  selectedStatus: string = 'all';
  
  showModal = false;
  showViewModal = false;
  isEditing = false;
  isSubmitting = false;
  selectedEmployee: Employee | null = null;
  editId: number | null = null;
  
  employeeForm!: FormGroup;
  
  skeletonRows = Array(5).fill(0);
  
  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }
  
  ngOnInit(): void {
    this.loadData();
  }
  
  initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      login: ['', Validators.required],
      password: ['', []],
      role: ['baker', Validators.required],
      position: ['', Validators.required],
      department: ['Производство', Validators.required],
      hireDate: [new Date().toISOString().split('T')[0], Validators.required],
      salary: [null, [Validators.required, Validators.min(0)]],
      status: ['active', Validators.required],
      address: [''],
      birthDate: [''],
      emergencyContact: [''],
      emergencyPhone: [''],
      notes: ['']
    });
  }
  
  loadData(): void {
    this.loading = true;
    Promise.all([
      this.employeeService.getAll().toPromise(),
      this.employeeService.getStats().toPromise()
    ]).then(([employees, stats]) => {
      const employeesData = Array.isArray(employees) ? employees : [];
      
      this.employees = employeesData;
      this.filteredEmployees = [...this.employees];
      this.stats = stats || {
        total: 0,
        active: 0,
        onVacation: 0,
        inactive: 0,
        avgSalary: 0,
        departments: []
      };
      
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      this.employees = [];
      this.filteredEmployees = [];
      this.stats = {
        total: 0,
        active: 0,
        onVacation: 0,
        inactive: 0,
        avgSalary: 0,
        departments: []
      };
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
  
  filterEmployees(): void {
    let result = [...this.employees];
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.position.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query) ||
        (e.login && e.login.toLowerCase().includes(query))
      );
    }
    
    if (this.selectedRole !== 'all') {
      result = result.filter(e => e.role === this.selectedRole);
    }
    
    if (this.selectedStatus !== 'all') {
      result = result.filter(e => e.status === this.selectedStatus);
    }
    
    this.filteredEmployees = result;
  }
  
  selectRole(role: string): void {
    this.selectedRole = role;
    this.filterEmployees();
  }
  
  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.filterEmployees();
  }
  
  openAddModal(): void {
    this.isEditing = false;
    this.editId = null;
    this.resetForm();
    this.employeeForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.employeeForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }
  
  openEditModal(employee: Employee): void {
    
    this.isEditing = true;
    this.editId = employee.id;
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('password')?.setValidators(null);
    this.employeeForm.get('password')?.updateValueAndValidity();
    let formattedHireDate = '';
    if (employee.hireDate) {
        if (employee.hireDate.includes('T')) {
            formattedHireDate = employee.hireDate.split('T')[0];
        } else {
            formattedHireDate = employee.hireDate;
        }
    }
    
    let formattedBirthDate = '';
    if (employee.birthDate) {
        if (employee.birthDate.includes('T')) {
            formattedBirthDate = employee.birthDate.split('T')[0];
        } else {
            formattedBirthDate = employee.birthDate;
        }
    }
    
    const formValues = {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        login: employee.login || '',
        role: employee.role,
        position: employee.position,
        department: employee.department,
        hireDate: formattedHireDate, // ← Используем отформатированную дату
        salary: employee.salary,
        status: employee.status,
        address: employee.address || '',
        birthDate: formattedBirthDate, // ← Используем отформатированную дату
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        notes: employee.notes || '',
        password: ''
    };
    
    this.employeeForm.patchValue(formValues);
    
    this.showModal = true;
}
  
  openViewModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.showViewModal = true;
  }
  
  closeModal(): void {
    this.showModal = false;
    this.selectedEmployee = null;
    this.editId = null;
    this.resetForm();
  }
  
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedEmployee = null;
  }
  
  editFromView(): void {
    if (this.selectedEmployee) {
      this.closeViewModal();
      this.openEditModal(this.selectedEmployee);
    }
  }
  
  resetForm(): void {
    this.employeeForm.reset({
      name: '',
      email: '',
      phone: '',
      login: '',
      password: '',
      role: 'baker',
      position: '',
      department: 'Производство',
      hireDate: new Date().toISOString().split('T')[0],
      salary: null,
      status: 'active',
      address: '',
      birthDate: '',
      emergencyContact: '',
      emergencyPhone: '',
      notes: ''
    });
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('password')?.setValidators(null);
    this.employeeForm.get('password')?.updateValueAndValidity();
  }
  
  submitForm(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      control?.markAsTouched();
    });
    if (this.isEditing && !this.employeeForm.get('password')?.value) {
      this.employeeForm.get('password')?.clearValidators();
      this.employeeForm.get('password')?.updateValueAndValidity();
    }
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
    });
    
    this.isSubmitting = true;
    const formValue = this.employeeForm.value;
    const submitData: any = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      login: formValue.login,
      role: formValue.role,
      position: formValue.position,
      department: formValue.department,
      hireDate: formValue.hireDate,
      salary: formValue.salary,
      status: formValue.status,
      address: formValue.address || null,
      birthDate: formValue.birthDate || null,
      emergencyContact: formValue.emergencyContact || null,
      emergencyPhone: formValue.emergencyPhone || null,
      notes: formValue.notes || null
    };
    if (formValue.password && formValue.password.trim() !== '') {
      submitData.password = formValue.password;
    }
    
    if (this.isEditing && this.editId) {
      this.employeeService.update(this.editId, submitData).subscribe({
        next: (res) => {
          this.loadData();
          this.closeModal();
          this.isSubmitting = false;
          alert('Сотрудник успешно обновлён');
        },
        error: (err) => {
          this.isSubmitting = false;
          const errorMsg = err.error?.message || (err.error?.errors ? Object.values(err.error.errors)[0] : 'Не удалось обновить сотрудника');
          alert(errorMsg);
        }
      });
    } else {
      if (!submitData.password) {
        this.isSubmitting = false;
        alert('Пароль обязателен при создании сотрудника');
        return;
      }
      this.employeeService.create(submitData).subscribe({
        next: (res) => {
          this.loadData();
          this.closeModal();
          this.isSubmitting = false;
          alert('Сотрудник успешно добавлен');
        },
        error: (err) => {
          this.isSubmitting = false;
          const errorMsg = err.error?.message || (err.error?.errors ? Object.values(err.error.errors)[0] : 'Не удалось добавить сотрудника');
          alert(errorMsg);
        }
      });
    }
  }
  
  deleteEmployee(employee: Employee): void {
    if (confirm(`Удалить сотрудника "${employee.name}"?`)) {
      this.employeeService.delete(employee.id).subscribe({
        next: () => {
          this.loadData();
          alert('Сотрудник удалён');
        },
        error: (err) => {
          alert('Не удалось удалить сотрудника');
        }
      });
    }
  }
  
  resetEmployeePassword(employee: Employee): void {
    const newPassword = prompt(`Введите новый пароль для сотрудника ${employee.name}:`);
    if (newPassword && newPassword.length >= 6) {
      this.employeeService.resetPassword(employee.id, newPassword).subscribe({
        next: (success) => {
          if (success) {
            alert('Пароль успешно изменён');
          } else {
            alert('Не удалось изменить пароль');
          }
        },
        error: (err) => {
          alert('Ошибка при сбросе пароля');
        }
      });
    } else if (newPassword) {
      alert('Пароль должен содержать минимум 6 символов');
    }
  }
  
  getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'baker': return 'Пекарь';
      case 'client': return 'Клиент';
      default: return role;
    }
  }
  
  getRoleClass(role: string): string {
    return `role-${role}`;
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Активен';
      case 'on_vacation': return 'В отпуске';
      case 'inactive': return 'Неактивен';
      default: return status;
    }
  }
  
  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}