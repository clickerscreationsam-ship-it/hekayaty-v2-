import { useState } from 'react';
import { useCalculateShipping, useCheckout } from '@/hooks/use-cart';
import { useEarnings, useRequestPayout } from '@/hooks/use-earnings';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EdgeFunctionsTest() {
    const { user } = useAuth();
    const calculateShipping = useCalculateShipping();
    const earnings = useEarnings(user);
    const [testResult, setTestResult] = useState<string>('');

    const testShippingCalculation = async () => {
        try {
            setTestResult('Testing shipping calculation...');
            const result = await calculateShipping.mutateAsync({
                items: [
                    { productId: 1, creatorId: user?.id || 'test', price: 5000 }
                ],
                city: 'Cairo'
            });
            setTestResult(`✅ Shipping: ${JSON.stringify(result)}`);
        } catch (error: any) {
            setTestResult(`❌ Error: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-4xl font-bold">Edge Functions Test Page</h1>

                {/* Connection Status */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
                    <div className="space-y-2">
                        <p>User: {user ? `✅ ${user.displayName}` : '❌ Not logged in'}</p>
                        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
                        <p>Functions URL: {import.meta.env.VITE_SUPABASE_URL}/functions/v1</p>
                    </div>
                </Card>

                {/* Shipping Test */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Test Shipping Calculation</h2>
                    <Button onClick={testShippingCalculation} disabled={calculateShipping.isPending}>
                        {calculateShipping.isPending ? 'Testing...' : 'Test Shipping API'}
                    </Button>
                    {testResult && (
                        <pre className="mt-4 p-4 bg-muted rounded text-sm">{testResult}</pre>
                    )}
                </Card>

                {/* Earnings Display */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Earnings Overview</h2>
                    {earnings.isLoading ? (
                        <p>Loading earnings...</p>
                    ) : (
                        <div className="space-y-2">
                            <p>Total Earnings: {earnings.totalEarnings} EGP</p>
                            <p>Current Balance: {earnings.currentBalance} EGP</p>
                            <p>Total Paid: {earnings.totalPaid} EGP</p>
                        </div>
                    )}
                </Card>

                {/* Quick Links */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Edge Functions Dashboard</h2>
                    <a
                        href="https://supabase.com/dashboard/project/honjxobxkxuqqouwptak/functions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        View in Supabase Dashboard →
                    </a>
                </Card>
            </div>
        </div>
    );
}
