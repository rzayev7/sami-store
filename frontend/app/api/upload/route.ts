import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../lib/cloudinary";

const MIN_UPLOAD_WIDTH = 1200;
const MIN_UPLOAD_HEIGHT = 1200;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No image provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
    }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error || !result) {
              return reject(error ?? new Error("Upload failed"));
            }
            resolve(result);
          }
        );
        stream.end(buffer);
      }
    );

    const width = Number(result.width || 0);
    const height = Number(result.height || 0);
    if (width < MIN_UPLOAD_WIDTH || height < MIN_UPLOAD_HEIGHT) {
      await cloudinary.uploader.destroy(result.public_id, { invalidate: true });
      return NextResponse.json(
        {
          message: `Image too small. Minimum required size is ${MIN_UPLOAD_WIDTH}x${MIN_UPLOAD_HEIGHT}px.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
