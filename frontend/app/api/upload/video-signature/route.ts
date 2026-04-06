import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import cloudinary from "../../../../lib/cloudinary";

export const runtime = "nodejs";

const VIDEO_FOLDER = "products/videos";

/**
 * Returns a Cloudinary-signed upload payload so the browser can POST the video
 * directly to `https://api.cloudinary.com/v1_1/:cloud_name/video/upload`
 * (avoids Next.js body size limits).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json(
        { message: "Admin token required" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "JWT_SECRET is not configured on the server" },
        { status: 500 }
      );
    }

    try {
      jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { message: "Cloudinary is not configured (CLOUDINARY_*)" },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = VIDEO_FOLDER;
    const uploadPreset = process.env.CLOUDINARY_VIDEO_UPLOAD_PRESET?.trim();

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };
    if (uploadPreset) {
      paramsToSign.upload_preset = uploadPreset;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      ...(uploadPreset ? { uploadPreset } : {}),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create upload signature";
    return NextResponse.json({ message }, { status: 500 });
  }
}
