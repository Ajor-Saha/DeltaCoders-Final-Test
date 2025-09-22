import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { env } from "../config/env";

export const createR2Client = () => {
  // Ensure that required env variables are set
  if (!env.ENDPOINT_URL || !env.ACCESS_KEY_ID || !env.SECRET_ACCESS_KEY) {
    throw new Error("Missing required R2 environment variables");
  }

  const config: S3ClientConfig = {
    region: "auto",
    endpoint: env.ENDPOINT_URL,
    credentials: {
      accessKeyId: env.ACCESS_KEY_ID,
      secretAccessKey: env.SECRET_ACCESS_KEY,
    },
  };

  return new S3Client(config);
};
