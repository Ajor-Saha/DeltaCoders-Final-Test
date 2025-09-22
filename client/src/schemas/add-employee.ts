import { z } from "zod"

export const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),

  role: z.enum(["admin", "senior_employee", "assigned_employee"], {
    required_error: "Please select a role.",
  }),
})