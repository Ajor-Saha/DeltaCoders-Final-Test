import { z } from "zod";

// Zod schema for creating a company
export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(100, { message: "Company name must not exceed 100 characters" }),
  
  category: z
    .string()
    .min(2, { message: "Category must be at least 2 characters" })
    .max(50, { message: "Category must not exceed 50 characters" }),
  
  address: z
    .object({
      street: z.string().min(2, { message: "Street address must be at least 2 characters" }),
      city: z.string().min(2, { message: "City must be at least 2 characters" }),
      state: z.string().min(2, { message: "State must be at least 2 characters" }),
      zipCode: z.string().min(4, { message: "Zip code must be at least 4 characters" }),
      country: z.string().min(2, { message: "Country must be at least 2 characters" }),
    })
    .refine(data => Object.values(data).every(value => value.trim() !== ""), {
      message: "All address fields must be non-empty",
    }),
});
