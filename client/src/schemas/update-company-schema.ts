import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(100, { message: "Company name must not exceed 100 characters" })
    .optional(),

  category: z
    .string()
    .min(2, { message: "Category must be at least 2 characters" })
    .max(50, { message: "Category must not exceed 50 characters" })
    .optional(),

  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),

  address: z
    .object({
      street: z
        .string()
        .min(2, { message: "Street address must be at least 2 characters" })
        .optional(),
      city: z
        .string()
        .min(2, { message: "City must be at least 2 characters" })
        .optional(),
      state: z
        .string()
        .min(2, { message: "State must be at least 2 characters" })
        .optional(),
      zipCode: z
        .string()
        .min(4, { message: "Zip code must be at least 4 characters" })
        .optional(),
      country: z
        .string()
        .min(2, { message: "Country must be at least 2 characters" })
        .optional(),
    })
    .refine(
      (data) => {
        // Ensuring that if any address field is updated, the others must not be empty
        return (
          Object.values(data).every((value) => value.trim() !== "") ||
          Object.values(data).every(
            (value) => value === undefined || value === ""
          )
        );
      },
      {
        message:
          "If any address field is updated, all address fields must be provided",
      }
    )
    .optional(),
});
