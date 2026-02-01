
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Feather, Loader2 } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.pick({
    username: true,
    password: true,
    email: true,
    displayName: true,
    role: true,
});

export default function AuthPage() {
    const [location, setLocation] = useLocation();
    const { user, loginMutation, registerMutation } = useAuth();

    // Navigate when user becomes available (after login/signup)
    useEffect(() => {
        console.log("🔍 AuthPage useEffect - user:", user);
        console.log("🔍 User role:", user?.role);
        console.log("🔍 User username:", user?.username);

        if (user) {
            if (user.role === "writer" || user.role === "artist") {
                // Redirect creators to their personalized store page
                const targetUrl = `/writer/${user.username}`;
                console.log("✅ Redirecting writer/artist to:", targetUrl);
                setLocation(targetUrl);
            } else {
                // Redirect readers to dashboard (profile settings)
                console.log("✅ Redirecting reader to: /dashboard");
                setLocation("/dashboard");
            }
        } else {
            console.log("❌ No user object available yet");
        }
    }, [user, setLocation]);

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <Navbar />
            {/* Left: Decorative */}
            <div className="hidden lg:flex flex-col justify-between bg-[#1a0f0a] text-white p-12 pt-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-lg">
                            <Feather className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-serif font-bold">Hekayaty</h1>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-serif font-bold leading-tight">
                            Start your journey into a world of stories.
                        </h2>
                        <p className="text-lg text-white/80">
                            Join thousands of readers, writers, and artists shaping the future of storytelling.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex justify-between items-end text-sm text-white/60">
                    <div>© 2026 Hekayaty. All rights reserved.</div>
                    <div className="font-medium text-primary">A Clickers Company Production</div>
                </div>
            </div>

            {/* Right: Forms */}
            <div className="flex items-center justify-center p-6 pt-24 bg-background">
                <div className="w-full max-w-md space-y-6">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login">Log In</TabsTrigger>
                            <TabsTrigger value="register">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <LoginForm />
                        </TabsContent>

                        <TabsContent value="register">
                            <RegisterForm />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function LoginForm() {
    const { loginMutation } = useAuth();
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: z.infer<typeof loginSchema>) => {
        loginMutation.mutate(data);
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" {...form.register("email")} placeholder="Enter your email" />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" {...form.register("password")} placeholder="Enter your password" />
                        {form.formState.errors.password && (
                            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Log In
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function RegisterForm() {
    const { registerMutation } = useAuth();
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: "reader"
        }
    });

    const onSubmit = (data: z.infer<typeof registerSchema>) => {
        registerMutation.mutate({
            email: data.email,
            password: data.password,
            username: data.username,
            displayName: data.displayName,
            role: (data.role || 'reader') as 'reader' | 'writer' | 'artist'
        });
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0">
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Enter your details to get started.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" {...form.register("email")} placeholder="hello@example.com" />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input {...form.register("username")} placeholder="Choose a username" />
                        {form.formState.errors.username && (
                            <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input {...form.register("displayName")} placeholder="Your full name" />
                        {form.formState.errors.displayName && (
                            <p className="text-sm text-red-500">{form.formState.errors.displayName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" {...form.register("password")} placeholder="Create a password" />
                        {form.formState.errors.password && (
                            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>I want to be a:</Label>
                        <RadioGroup
                            defaultValue="reader"
                            onValueChange={(val) => form.setValue("role", val as any)}
                            className="grid grid-cols-3 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="reader" id="reader" className="peer sr-only" />
                                <Label
                                    htmlFor="reader"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    Reader
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="writer" id="writer" className="peer sr-only" />
                                <Label
                                    htmlFor="writer"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    Writer
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="artist" id="artist" className="peer sr-only" />
                                <Label
                                    htmlFor="artist"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    Artist
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign Up
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
