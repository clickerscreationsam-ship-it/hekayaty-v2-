import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema validation
const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function ResetPassword() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [sessionCheck, setSessionCheck] = useState(true);

    // Check if we have a valid session (Supabase automatically handles access token from URL)
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If no session, user might have clicked an expired link or just navigated here manually
                // However, standard Supabase implicit flow puts tokens in hash, client handles it.
                // We give it a moment to process.
                console.log("No active session found immediately on mount. Checking async...");
            }
            setSessionCheck(false);
        };
        checkSession();

        // Listen for auth state changes (importantly, PASSWORD_RECOVERY event)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Reset Password Auth State Change:", event);
            if (event === "PASSWORD_RECOVERY") {
                // This is the ideal state
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) throw error;

            setIsSuccess(true);
            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully.",
            });

            // Redirect after a short delay
            setTimeout(() => {
                setLocation("/auth");
            }, 3000);

        } catch (err: any) {
            console.error("Update Password Error:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to update password. Link may be expired.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <Card className="w-full max-w-md border-border/50 shadow-xl">
                        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold">Password Reset Successful</h2>
                            <p className="text-muted-foreground">
                                Your password has been securely updated. You will be redirected to the login page momentarily.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/auth">Go to Login</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-border/50 shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-serif font-bold text-center">Set New Password</CardTitle>
                        <CardDescription className="text-center">
                            Please enter your new secure password below
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Min 8 characters"
                                        className="pl-10"
                                        {...form.register("password")}
                                    />
                                </div>
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter password"
                                        className="pl-10"
                                        {...form.register("confirmPassword")}
                                    />
                                </div>
                                {form.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Password...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
