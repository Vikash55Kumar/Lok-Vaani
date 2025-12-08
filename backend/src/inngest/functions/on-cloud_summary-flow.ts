// src/inngest/commentWorkflow.inngest.ts
import { prisma } from "../../db/index";
import { inngest } from "../client";
import axios from "axios";

// 1. generated summary and save to DB



// Generate word cloud event
export const generateWordCloudEvent = inngest.createFunction(
  { id: "generate-word-cloud" },
  { event: "app/generate.wordcloud" },
  async ({ event, step }) => {
    const maxAttempts = 3;
    let lastError = null;
    let response = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await step.run(`call-ai-wordcloud-attempt-${attempt}`, async () => {
          const res = await axios.get(
            "https://lokvaani-ai-module4-cloud-264138289274.asia-south2.run.app/api/cloud-generate"
          );
          return res.data;
        });
        // If response is successful, break the loop
        if (response) {
          return { success: true, data: response, attempts: attempt };
        }
      } catch (error: any) {
        lastError = error;
      }
    }

    // If all attempts fail
    return {
      success: false,
      error: lastError?.message || "Failed to generate word cloud after multiple attempts"
    };
  }
);