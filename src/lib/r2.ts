import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "mohamed-helmy";
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/+$/, "");

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName && publicDomain
);

export const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

/**
 * Uploads a file buffer directly to Cloudflare R2 bucket
 * Returns the public URL of the uploaded object
 */
export async function uploadToR2({
  key,
  buffer,
  contentType,
}: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  if (!r2Client || !isR2Configured) {
    throw new Error("Cloudflare R2 is not fully configured.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  return `${publicDomain}/${key}`;
}
