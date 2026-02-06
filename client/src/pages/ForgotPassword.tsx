import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";

// Schema validation
const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                // We log the error but still show success to user if it's "User not found" to prevent enumeration
                // Only show real error if it's rate-limit or system error
                console.error("Supabase Reset Error:", error);

                if (error.status === 429) {
                    setError("Too many requests. Please try again later.");
                    setIsLoading(false);
                    return;
                }
            }

            // Always show success state for security (unless rate limited)
            setIsSubmitted(true);
        } catch (err) {
            console.error("Reset Password Exception:", err);
            // Fallback
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-border/50 shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-serif font-bold text-center">Reset Password</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email to receive a reset link
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isSubmitted ? (
                            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-xl">Check your email</h3>
                                    <p className="text-muted-foreground text-sm">
                                        If an account exists for <span className="font-semibold text-foreground">{form.getValues("email")}</span>,
                                        we have sent a password reset link.
                                    </p>
                                    <p className="text-xs text-muted-foreground pt-4">
                                        Please check your spam folder if you don't see the email within a few minutes.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full mt-4" onClick={() => setIsSubmitted(false)}>
                                    Try another email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-10"
                                            {...form.register("email")}
                                        />
                                    </div>
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 text-sm bg-red-500/10 text-red-500 rounded-md border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Link...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
                        <Link href="/auth">
                            <span className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 cursor-pointer transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </span>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
