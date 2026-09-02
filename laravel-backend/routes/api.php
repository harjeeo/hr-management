<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DesignationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\HolidayController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\RecruitmentController;
use App\Http\Controllers\Api\ReportsController;
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

    Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('attendance/me/today', [AttendanceController::class, 'myToday']);
    Route::get('attendance/me/history', [AttendanceController::class, 'myHistory']);
    Route::post('attendance/corrections', [AttendanceController::class, 'requestCorrection']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER,MANAGER')->group(function () {
        Route::get('attendance', [AttendanceController::class, 'orgAttendance']);
        Route::get('attendance/corrections', [AttendanceController::class, 'listCorrections']);
        Route::put('attendance/corrections/{id}', [AttendanceController::class, 'reviewCorrection']);
    });

    Route::get('leave/types', [LeaveController::class, 'listTypes']);
    Route::get('leave/balances/me', [LeaveController::class, 'myBalances']);
    Route::post('leave/requests', [LeaveController::class, 'apply']);
    Route::get('leave/requests/me', [LeaveController::class, 'myRequests']);
    Route::post('leave/requests/{id}/cancel', [LeaveController::class, 'cancel']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('leave/types', [LeaveController::class, 'createType']);
        Route::put('leave/types/{id}', [LeaveController::class, 'updateType']);
        Route::delete('leave/types/{id}', [LeaveController::class, 'removeType']);
        Route::post('leave/balances', [LeaveController::class, 'allocateBalance']);
    });

    Route::middleware('role:ORG_ADMIN,HR_MANAGER,MANAGER')->group(function () {
        Route::get('leave/balances/{employeeId}', [LeaveController::class, 'employeeBalances']);
        Route::get('leave/requests', [LeaveController::class, 'listRequests']);
        Route::put('leave/requests/{id}/review', [LeaveController::class, 'review']);
    });

    Route::get('holidays', [HolidayController::class, 'index']);
    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('holidays', [HolidayController::class, 'store']);
        Route::put('holidays/{id}', [HolidayController::class, 'update']);
        Route::delete('holidays/{id}', [HolidayController::class, 'destroy']);
    });

    Route::get('documents', [DocumentController::class, 'index']);
    Route::post('documents', [DocumentController::class, 'store']);
    Route::delete('documents/{id}', [DocumentController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);

    Route::get('payroll/payslips/me', [PayrollController::class, 'myPayslips']);
    Route::get('payroll/payslips/{id}', [PayrollController::class, 'payslipDetail']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::get('payroll/salary-structures/{employeeId}', [PayrollController::class, 'getSalaryStructure']);
        Route::put('payroll/salary-structures/{employeeId}', [PayrollController::class, 'upsertSalaryStructure']);
        Route::get('payroll/runs', [PayrollController::class, 'listRuns']);
        Route::get('payroll/runs/{id}', [PayrollController::class, 'runDetailAction']);
        Route::post('payroll/runs', [PayrollController::class, 'process']);

        Route::get('reports/employees', [ReportsController::class, 'employees']);
        Route::get('reports/attendance', [ReportsController::class, 'attendance']);
        Route::get('reports/leave', [ReportsController::class, 'leave']);
        Route::get('reports/payroll', [ReportsController::class, 'payroll']);
    });

    Route::get('plans', [BillingController::class, 'listPlans']);
    Route::get('subscriptions/me', [BillingController::class, 'mySubscription']);
    Route::middleware('role:ORG_ADMIN')->post('subscriptions/me/change-plan', [BillingController::class, 'changePlan']);

    Route::get('recruitment/jobs', [RecruitmentController::class, 'listJobs']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('recruitment/jobs', [RecruitmentController::class, 'createJob']);
        Route::put('recruitment/jobs/{id}', [RecruitmentController::class, 'updateJob']);
        Route::delete('recruitment/jobs/{id}', [RecruitmentController::class, 'removeJob']);

        Route::get('recruitment/candidates', [RecruitmentController::class, 'listCandidates']);
        Route::post('recruitment/candidates', [RecruitmentController::class, 'createCandidate']);
        Route::put('recruitment/candidates/{id}', [RecruitmentController::class, 'updateCandidate']);
        Route::delete('recruitment/candidates/{id}', [RecruitmentController::class, 'removeCandidate']);
        Route::post('recruitment/candidates/{id}/resume', [RecruitmentController::class, 'uploadResume']);
        Route::post('recruitment/candidates/{id}/hire', [RecruitmentController::class, 'hire']);
    });

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->prefix('onboarding')->group(function () {
        Route::get('employees/{employeeId}', [OnboardingController::class, 'list']);
        Route::post('employees/{employeeId}', [OnboardingController::class, 'addTask']);
        Route::put('tasks/{id}', [OnboardingController::class, 'updateTask']);
        Route::delete('tasks/{id}', [OnboardingController::class, 'removeTask']);
    });

    Route::get('performance/cycles', [PerformanceController::class, 'listCycles']);
    Route::get('performance/cycles/{cycleId}/goals/me', [PerformanceController::class, 'myGoals']);
    Route::put('performance/goals/{id}', [PerformanceController::class, 'updateGoal']);
    Route::get('performance/cycles/{cycleId}/reviews/me', [PerformanceController::class, 'myReview']);
    Route::post('performance/cycles/{cycleId}/reviews/self', [PerformanceController::class, 'submitSelfReview']);

    Route::middleware('role:ORG_ADMIN,HR_MANAGER')->group(function () {
        Route::post('performance/cycles', [PerformanceController::class, 'createCycle']);
        Route::put('performance/cycles/{id}', [PerformanceController::class, 'updateCycle']);
    });

    Route::middleware('role:ORG_ADMIN,HR_MANAGER,MANAGER')->group(function () {
        Route::get('performance/cycles/{cycleId}/goals', [PerformanceController::class, 'listGoals']);
        Route::post('performance/cycles/{cycleId}/goals', [PerformanceController::class, 'createGoal']);
        Route::get('performance/cycles/{cycleId}/reviews', [PerformanceController::class, 'listReviews']);
        Route::post('performance/cycles/{cycleId}/reviews/{employeeId}/manager', [PerformanceController::class, 'submitManagerReview']);
    });

    Route::middleware('role:SUPER_ADMIN')->prefix('super-admin')->group(function () {
        Route::get('organizations', [SuperAdminController::class, 'organizations']);
        Route::put('organizations/{id}/status', [SuperAdminController::class, 'setStatus']);
        Route::get('stats', [SuperAdminController::class, 'stats']);

        Route::get('plans', [BillingController::class, 'listAllPlans']);
        Route::post('plans', [BillingController::class, 'createPlan']);
        Route::put('plans/{id}', [BillingController::class, 'updatePlan']);
        Route::get('subscriptions', [BillingController::class, 'listSubscriptions']);
        Route::post('invoices/{id}/mark-paid', [BillingController::class, 'markInvoicePaid']);
        Route::get('billing-stats', [BillingController::class, 'billingStats']);
    });
});
