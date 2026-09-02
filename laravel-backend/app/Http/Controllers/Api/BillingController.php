<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BillingController extends Controller
{
    private function monthlyEquivalent(float $price, string $cycle): float
    {
        return $cycle === 'YEARLY' ? $price / 12 : $price;
    }

    public function listPlans()
    {
        return Plan::where('is_active', true)->orderBy('price')->get();
    }

    public function mySubscription(Request $request)
    {
        $sub = Subscription::with(['plan', 'invoices' => fn ($q) => $q->orderByDesc('issued_at')])
            ->where('organization_id', $request->user()->organization_id)
            ->first();
        abort_if(! $sub, 404, 'No subscription found');

        return response()->json($sub);
    }

    public function changePlan(Request $request)
    {
        $data = $request->validate(['planId' => ['required', 'string']]);

        $sub = Subscription::where('organization_id', $request->user()->organization_id)->first();
        abort_if(! $sub, 404, 'No subscription found');

        $plan = Plan::where('id', $data['planId'])->where('is_active', true)->first();
        abort_if(! $plan, 404, 'Plan not found');

        $periodEnd = now()->addMonths($plan->billing_cycle === 'YEARLY' ? 12 : 1);

        $sub->update([
            'plan_id' => $plan->id,
            'status' => $plan->price == 0 ? 'ACTIVE' : 'PAST_DUE',
            'current_period_end' => $periodEnd,
        ]);
        $sub->load('plan');

        if ($plan->price > 0) {
            Invoice::create([
                'subscription_id' => $sub->id,
                'amount' => $plan->price,
                'status' => 'PENDING',
                'issued_at' => now(),
            ]);
        }

        return response()->json($sub);
    }

    public function listAllPlans()
    {
        return Plan::orderBy('price')->get();
    }

    public function createPlan(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'price' => ['required', 'numeric', 'min:0'],
            'billingCycle' => ['sometimes', Rule::in(['MONTHLY', 'YEARLY'])],
            'employeeLimit' => ['required', 'integer', 'min:1'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string'],
        ]);

        if (Plan::where('name', $data['name'])->exists()) {
            throw ValidationException::withMessages(['name' => 'Plan already exists'])->status(409);
        }

        $plan = Plan::create([
            'name' => $data['name'],
            'price' => $data['price'],
            'billing_cycle' => $data['billingCycle'] ?? 'MONTHLY',
            'employee_limit' => $data['employeeLimit'],
            'features' => $data['features'] ?? [],
        ]);

        return response()->json($plan, 201);
    }

    public function updatePlan(Request $request, string $id)
    {
        $plan = Plan::find($id);
        abort_if(! $plan, 404, 'Plan not found');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'billingCycle' => ['sometimes', Rule::in(['MONTHLY', 'YEARLY'])],
            'employeeLimit' => ['sometimes', 'integer', 'min:1'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $plan->update([
            'name' => $data['name'] ?? $plan->name,
            'price' => $data['price'] ?? $plan->price,
            'billing_cycle' => $data['billingCycle'] ?? $plan->billing_cycle,
            'employee_limit' => $data['employeeLimit'] ?? $plan->employee_limit,
            'features' => $data['features'] ?? $plan->features,
            'is_active' => array_key_exists('isActive', $data) ? $data['isActive'] : $plan->is_active,
        ]);

        return response()->json($plan);
    }

    public function listSubscriptions()
    {
        return Subscription::with([
            'plan',
            'organization:id,name,slug',
            'invoices' => fn ($q) => $q->orderByDesc('issued_at'),
        ])->orderByDesc('created_at')->get();
    }

    public function markInvoicePaid(string $id)
    {
        $invoice = Invoice::with('subscription')->find($id);
        abort_if(! $invoice, 404, 'Invoice not found');

        $invoice->update(['status' => 'PAID', 'paid_at' => now()]);
        $invoice->subscription->update(['status' => 'ACTIVE']);

        return response()->json($invoice->subscription);
    }

    public function billingStats()
    {
        $activeSubs = Subscription::with('plan')->where('status', 'ACTIVE')->get();
        $mrr = $activeSubs->sum(fn ($s) => $this->monthlyEquivalent($s->plan->price, $s->plan->billing_cycle));

        return response()->json([
            'mrr' => $mrr,
            'arr' => $mrr * 12,
            'activeSubscriptions' => $activeSubs->count(),
        ]);
    }
}
