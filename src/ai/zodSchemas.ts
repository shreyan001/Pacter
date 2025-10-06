import { z } from "zod";

// Schema for extracting user input information in a structured way
export const UserInputExtractionSchema = z.object({
  extractedInfo: z.object({
    projectName: z.string().nullable().describe("The name of the project/website to be built"),
    projectDescription: z.string().nullable().describe("Description of what needs to be built/developed"),
    clientName: z.string().nullable().describe("Name of the client/company hiring for the project"),
    paymentAmount: z.number().nullable().describe("Payment amount in USD (numeric value only)"),
    additionalDetails: z.string().nullable().describe("Any other relevant project details mentioned")
  }).describe("Extracted information from user input"),
  
  completionStatus: z.object({
    hasProjectName: z.boolean().describe("Whether project name was found in the input"),
    hasProjectDescription: z.boolean().describe("Whether project description was found in the input"),
    hasClientName: z.boolean().describe("Whether client/company name was found in the input"),
    hasPaymentAmount: z.boolean().describe("Whether payment amount was found in the input"),
    isComplete: z.boolean().describe("Whether all required information has been collected")
  }).describe("Status of information collection completeness"),
  
  confidence: z.object({
    projectName: z.number().min(0).max(1).describe("Confidence level for project name extraction (0-1)"),
    projectDescription: z.number().min(0).max(1).describe("Confidence level for project description extraction (0-1)"),
    clientName: z.number().min(0).max(1).describe("Confidence level for client name extraction (0-1)"),
    paymentAmount: z.number().min(0).max(1).describe("Confidence level for payment amount extraction (0-1)")
  }).describe("Confidence levels for each extracted field")
});

// Helper function for safe parsing with detailed error handling
export function safeParseUserInput(data: unknown) {
  const result = UserInputExtractionSchema.safeParse(data);
  
  if (!result.success) {
    console.error("Zod validation failed:", result.error.issues);
    return {
      success: false,
      error: result.error,
      data: null
    };
  }
  
  return {
    success: true,
    error: null,
    data: result.data
  };
}

// Type exports for TypeScript usage
export type UserInputExtraction = z.infer<typeof UserInputExtractionSchema>;
export type ExtractedInfo = UserInputExtraction['extractedInfo'];
export type CompletionStatus = UserInputExtraction['completionStatus'];
export type ConfidenceLevels = UserInputExtraction['confidence'];