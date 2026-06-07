import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PATHS = [
  "/products",
  "/products/featured",
  "/products/new-arrivals",
];

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return false;

  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { paths?: unknown; productId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const extraPaths = Array.isArray(body.paths)
    ? body.paths.map((path) => String(path || "").trim()).filter(Boolean)
    : [];
  const productId = String(body.productId || "").trim();
  const paths = [
    ...DEFAULT_PATHS,
    ...(productId ? [`/products/${productId}`] : []),
    ...extraPaths,
  ];

  const uniquePaths = [...new Set(paths)];
  uniquePaths.forEach((path) => revalidatePath(path));

  return NextResponse.json({ revalidated: true, paths: uniquePaths });
}
