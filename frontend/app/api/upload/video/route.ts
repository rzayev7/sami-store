import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary";

const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const ALLOWED_PREFIXES = ["video/"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No video provided" }, { status: 400 });
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { message: `Video too large. Maximum size is ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const mime = file.type || "";
    if (!ALLOWED_PREFIXES.some((p) => mime.startsWith(p))) {
      return NextResponse.json(
        { message: "Invalid file type. Use MP4, WebM, or MOV." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "products/videos",
          resource_type: "video",
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            return reject(error ?? new Error("Upload failed"));
          }
          resolve(uploadResult);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Video upload failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
