import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import cloudinary from "../../../lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json(
        { message: "Admin token required" },
        { status: 401 },
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "JWT_SECRET is not configured on the server" },
        { status: 500 },
      );
    }

    try {
      jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No image provided" },
        { status: 400 }
      );
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "File must be under 10 MB" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{
      secure_url: string;
    }>((resolve, reject) => {
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
    });

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
