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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
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
    onSuccess: (data: { checkoutUrl: string }) => {
      toast({
        title: "Account Created!",
        description: "Redirecting to payment...",
      });
      window.location.href = data.checkoutUrl;
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
