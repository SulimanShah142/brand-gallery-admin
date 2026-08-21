import { UTApi } from "uploadthing/server";
import { db } from "../db";
import { messages } from "@project/shared";
import { lt } from "drizzle-orm";

const utapi = new UTApi();

export async function deleteOldMessages() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // 1. Find all messages with attachments older than 7 days
  const oldMessages = await db.select().from(messages).where(lt(messages.createdAt, sevenDaysAgo));
  
  const fileKeys = oldMessages
    .filter(m => m.attachmentUrl)
    .map(m => m.attachmentUrl!.split("/f/")[1]); // Extracting the key from URL

  // 2. Delete from UploadThing Storage
  if (fileKeys.length > 0) {
    await utapi.deleteFiles(fileKeys);
    console.log(`🗑️ Deleted ${fileKeys.length} files from UploadThing`);
  }

  // 3. Delete from PostgreSQL
  await db.delete(messages).where(lt(messages.createdAt, sevenDaysAgo));
  console.log("🧹 7-day message cleanup complete");
}
