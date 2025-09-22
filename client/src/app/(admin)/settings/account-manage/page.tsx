"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api-success-type";
import useAuthStore from "@/store/store";
import { Axios } from "@/config/axios";


export default function ProfileSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);
    
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/auth/update-profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      );

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        // Update local state and auth store
        updateUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message ?? "An error occurred while updating the profile.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/auth/update-profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.data) {
        updateUser({ avatar: response.data.data.avatar });
      }
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message ?? "An error occurred while updating the profile picture.";
      toast.error(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await Axios.delete(`${env.BACKEND_BASE_URL}/api/update-profile-picture`);
      updateUser({ ...user, avatar: undefined });
      toast.success("Profile picture deleted successfully!");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message ?? "An error occurred while deleting the profile picture.";
      toast.error(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">My Profile</h1>
                <p className="text-muted-foreground">
                  Manage your profile settings
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-4">Your profile photo</h2>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border border-border">
                        <Image
                          src={user?.avatar || "/asset/mysterious-mafia-man-smoking-cigarette_52683-34828.avif"}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2 hover:text-green-500"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Change photo
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-destructive"
                        onClick={handleDeletePhoto}
                        disabled={isUploadingPhoto}
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Add your photo. Recommended size is 256×256px
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter First Name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter Last Name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      name="email"
                      value={formData.email}
                      disabled
                      className="bg-muted/30 text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full cursor-pointer mt-8 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-l py-4 font-medium text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </form>
              </div>

              <div className="flex flex-col justify-between items-start flex-grow w-full border border-border rounded-lg p-6">
                <div className="relative w-full h-auto flex-grow py-4">
                  <Image
                    src="/asset/young-man-cartoon-character-with-phone_23-2150964369.avif"
                    alt="Profile Illustration"
                    layout="intrinsic"
                    width={400}
                    height={400}
                    className="rounded-lg w-full h-auto object-contain"
                  />
                  <div className="flex flex-col py-2 text-center max-w-xs">
                    <h3 className="font-medium mb-2">
                      Build trust with your profile!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your profile information helps others recognize you and
                      builds credibility. A complete profile increases
                      engagement and trust.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
