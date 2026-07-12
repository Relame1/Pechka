<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::whereIn('role', ['admin', 'manager', 'baker'])->get();
        $employeesArray = $employees->map(function ($employee) {
            return $this->convertToCamelCase($employee);
        });
        
        return response()->json($employeesArray);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'required|string|max:20',
            'login' => 'required|string|unique:users|max:50',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,manager,baker',
            'position' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'hireDate' => 'required|date',
            'salary' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive,on_vacation',
            'address' => 'nullable|string',
            'birthDate' => 'nullable|date',
            'emergencyContact' => 'nullable|string|max:255',
            'emergencyPhone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);
        $dbData = $this->convertToSnakeCase($validated);
        $dbData['password'] = Hash::make($validated['password']);

        $user = User::create($dbData);
        $responseData = $this->convertToCamelCase($user);

        return response()->json([
            'success' => true,
            'message' => 'Сотрудник добавлен',
            'data' => $responseData
        ], 201);
    }

    public function show($id)
    {
        $employee = User::whereIn('role', ['admin', 'manager', 'baker'])->findOrFail($id);
        $responseData = $this->convertToCamelCase($employee);
        
        return response()->json($responseData);
    }

    public function update(Request $request, $id)
    {
        $employee = User::whereIn('role', ['admin', 'manager', 'baker'])->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'sometimes|string|max:20',
            'login' => ['sometimes', 'string', 'max:50', Rule::unique('users')->ignore($id)],
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|in:admin,manager,baker',
            'position' => 'sometimes|string|max:255',
            'department' => 'sometimes|string|max:255',
            'hireDate' => 'sometimes|date',
            'salary' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:active,inactive,on_vacation',
            'address' => 'nullable|string',
            'birthDate' => 'nullable|date',
            'emergencyContact' => 'nullable|string|max:255',
            'emergencyPhone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);
        $updateData = $this->convertToSnakeCase($validated);
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        } else {
            unset($updateData['password']);
        }

        $employee->update($updateData);
        $updatedEmployee = User::findOrFail($id);
        $responseData = $this->convertToCamelCase($updatedEmployee);

        return response()->json([
            'success' => true,
            'message' => 'Сотрудник обновлён',
            'data' => $responseData
        ]);
    }

    public function destroy($id)
    {
        $employee = User::whereIn('role', ['admin', 'manager', 'baker'])->findOrFail($id);
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Сотрудник удалён'
        ]);
    }

    public function stats()
    {
        $employees = User::whereIn('role', ['admin', 'manager', 'baker'])->get();
        
        $total = $employees->count();
        $active = $employees->where('status', 'active')->count();
        $onVacation = $employees->where('status', 'on_vacation')->count();
        $inactive = $employees->where('status', 'inactive')->count();
        $avgSalary = $total > 0 ? round($employees->avg('salary')) : 0;
        
        $departments = $employees->groupBy('department')
            ->map(function ($group) {
                return ['name' => $group->first()->department, 'count' => $group->count()];
            })
            ->values()
            ->toArray();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'onVacation' => $onVacation,
            'inactive' => $inactive,
            'avgSalary' => $avgSalary,
            'departments' => $departments
        ]);
    }

    public function resetPassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $employee = User::whereIn('role', ['admin', 'manager', 'baker'])->findOrFail($id);
        $employee->password = Hash::make($request->password);
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Пароль изменён'
        ]);
    }

    /**
     * Преобразует camelCase ключи массива в snake_case
     * 
     * @param array $data
     * @return array
     */
    private function convertToSnakeCase(array $data): array
    {
        $mapping = [
            'hireDate' => 'hire_date',
            'birthDate' => 'birth_date',
            'emergencyContact' => 'emergency_contact',
            'emergencyPhone' => 'emergency_phone',
        ];
        
        $result = [];
        foreach ($data as $key => $value) {
            $newKey = $mapping[$key] ?? $key;
            $result[$newKey] = $value;
        }
        
        return $result;
    }

    /**
     * Преобразует snake_case поля модели в camelCase для ответа
     * 
     * @param User $user
     * @return array
     */
    private function convertToCamelCase(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'login' => $user->login,
            'role' => $user->role,
            'position' => $user->position,
            'department' => $user->department,
            'hireDate' => $user->hire_date,  // ← преобразуем в camelCase
            'salary' => $user->salary,
            'status' => $user->status,
            'address' => $user->address,
            'birthDate' => $user->birth_date,  // ← преобразуем в camelCase
            'emergencyContact' => $user->emergency_contact,  // ← преобразуем в camelCase
            'emergencyPhone' => $user->emergency_phone,  // ← преобразуем в camelCase
            'notes' => $user->notes,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}