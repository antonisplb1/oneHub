import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getCurrentUser, login, logout, signup } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api", "auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
      
      const user = data.user;
      if (!user.emailVerified) {
        toast({
          title: "Email not verified",
          description: "Please check your email and verify your account before continuing.",
          variant: "destructive",
        });
        return;
      }
      
      if (user.subscriptionStatus !== "active") {
        setLocation("/subscription-required");
        return;
      }
      
      setLocation("/dashboard");
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (data: { success: boolean; message: string }) => {
      toast({
        title: "Registration Successful!",
        description: data.message || "Please check your email to verify your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
    },
  });

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
  };
}
