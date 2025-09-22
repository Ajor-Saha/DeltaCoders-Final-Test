"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Axios } from "@/config/axios";
import { AxiosError } from "axios";
import { z } from "zod";

// Define OTP validation schema
const otpSchema = z.object({
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});

const OTPVerification = () => {
  const router = useRouter();
  const params = useParams<{ email: string }>();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate OTP with Zod
    const validationResult = otpSchema.safeParse({ code: otp });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await Axios.post(`/api/auth/email-verification`, {
        email: params.email,
        code: otp,
      });

      toast.success(response.data.message || "Account verified successfully.");
      router.push("/sign-in");
    } catch (error) {
      console.error("Error during verification:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data.message ?? "Verification failed. Try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Verify Your Account</h2>
        <p className="text-center mb-4">Enter the 6-digit code sent to your email</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="block font-medium mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-2 rounded-md font-semibold transition-all ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
            }`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
