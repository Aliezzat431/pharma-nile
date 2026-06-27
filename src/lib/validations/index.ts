import { z } from "zod";

// --- Base Reusable Fields ---
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

export const phoneSchema = z
  .string()
  .regex(/^(01)[0-9]{9}$/, { message: "Invalid Egyptian phone number" });

// --- Application Specific Schemas ---

/**
 * Staff & User Validation
 */
export const staffCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["admin", "staff"]).default("staff"),
  salary: z.coerce.number().nonnegative().optional().default(0),
  incentives: z.coerce.number().nonnegative().optional().default(0)
});

/**
 * Authentication Validation
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Product & Inventory Validation
 */
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  type: z.string().min(1, "Treatment type is required"),
  company: z.string().optional(),
  unit_conversion: z.coerce.number().min(1).default(1),
  barcode: z.string().min(1, "Valid barcode is required"),
  quantity: z.coerce.number().int().nonnegative("Quantity cannot be negative"),
  purchase_price: z.coerce.number().positive("Purchase price must be > 0"),
  sale_price: z.coerce.number().positive("Selling price must be > 0"),
  expiry_date: z.string().min(1, "التاريخ مطلوب (مثل 05/2027)"),
});

/**
 * Customer Validation
 */
export const customerSchema = z.object({
  name: z.string().min(3, "Customer name is required"),
  phone: phoneSchema.optional().or(z.literal('')),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  creditLimit: z.number().nonnegative().default(0),
});

/**
 * Debt Validation
 */
export const debtorSchema = z.object({
  name: z.string().min(2, "Debtor name is required"),
  phone: z.string().optional().or(z.literal('')),
});

export const debtPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  payment_type: z.enum(["partial", "full"]).default("partial"),
  note: z.string().optional(),
});

/**
 * Invoice / Order Validation
 */
export const invoiceItemSchema = z.object({
  productId: z.string().or(z.number()),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().max(100).default(0),
});

export const invoiceSchema = z.object({
  customerId: z.string().or(z.number()).optional(),
  items: z.array(invoiceItemSchema).min(1, "Invoice must contain at least one item"),
  paymentMethod: z.enum(["cash", "credit", "card"]),
  amountPaid: z.number().nonnegative(),
});

// Examples of how to export inferred types for use across your app
export type Product = z.infer<typeof productSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
