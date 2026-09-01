<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DesignationController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SuperAdminController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register-organization', [AuthController::class, 'registerOrganization']);
Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('organizations/me', [OrganizationController::class, 'show']);
    Route::middleware('role:ORG_ADMIN')->put('organizations/me', [OrganizationController::class, 'update']);

    Route::get('branches', [BranchController::class, 'index']);
    Route::get('departments', [DepartmentController::class, 'index']);
    Route::get('designations', [DesignationController::class, 'index']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('branches', [BranchController::class, 'store']);
        Route::put('branches/{id}', [BranchController::class, 'update']);
        Route::post('departments', [DepartmentController::class, 'store']);
        Route::put('departments/{id}', [DepartmentController::class, 'update']);
        Route::post('designations', [DesignationController::class, 'store']);
        Route::put('designations/{id}', [DesignationController::class, 'update']);
    });

    Route::middleware('role:ORG_ADMIN')->group(function () {
        Route::delete('branches/{id}', [BranchController::class, 'destroy']);
        Route::delete('departments/{id}', [DepartmentController::class, 'destroy']);
        Route::delete('designations/{id}', [DesignationController::class, 'destroy']);
    });

    Route::get('employees', [EmployeeController::class, 'index']);
    Route::get('employees/me', [EmployeeController::class, 'mine']);
    Route::get('employees/{id}', [EmployeeController::class, 'show']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::put('employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('employees/{id}', [EmployeeController::class, 'destroy']);
        Route::post('employees/{id}/create-login', [EmployeeController::class, 'createLogin']);
    });

    Route::middleware('role:SUPER_ADMIN')->prefix('super-admin')->group(function () {
        Route::get('organizations', [SuperAdminController::class, 'organizations']);
        Route::put('organizations/{id}/status', [SuperAdminController::class, 'setStatus']);
        Route::get('stats', [SuperAdminController::class, 'stats']);
    });
});
