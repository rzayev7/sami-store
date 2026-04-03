const KAPITAL_TEST_BASE_URL =
  process.env.KAPITAL_TEST_BASE_URL || "https://txpgtst.kapitalbank.az";
const KAPITAL_TEST_API_PREFIX = process.env.KAPITAL_TEST_API_PREFIX || "/api";
const KAPITAL_TEST_CREATE_ORDER_PATH =
  process.env.KAPITAL_TEST_CREATE_ORDER_PATH || "/order";
const KAPITAL_TEST_GET_ORDER_PATH_TEMPLATE =
  process.env.KAPITAL_TEST_GET_ORDER_PATH_TEMPLATE ||
  "/order/{orderId}/?tranDetailLevel=2&tokenDetailLevel=2&orderDetailLevel=2";

const ensureLeadingSlash = (value) => {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
};

const joinUrl = (...parts) => parts.join("").replace(/([^:]\/)\/+/g, "$1");

const getBaseApiUrl = () =>
  joinUrl(
    KAPITAL_TEST_BASE_URL.replace(/\/+$/, ""),
    ensureLeadingSlash(KAPITAL_TEST_API_PREFIX).replace(/\/+$/, "")
  );

const getBasicAuthHeader = () => {
  const username = process.env.KAPITAL_TEST_USERNAME || "";
  const password = process.env.KAPITAL_TEST_PASSWORD || "";
  if (!username || !password) {
    throw new Error("Kapital Bank test credentials are not configured");
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
};

const mapCreateOrderPayload = ({
  amountMinor,
  currency,
  language,
  description,
  approveUrl,
  declineUrl,
  cancelUrl,
  callbackUrl,
  orderTypeRid,
}) => ({
  order: {
    typeRid: orderTypeRid,
    amount: amountMinor,
    currency,
    language,
    description,
    hppRedirectUrl: approveUrl,
    approveUrl,
    declineUrl,
    cancelUrl,
    callbackUrl,
  },
});

const doRequest = async (path, options = {}) => {
  const url = joinUrl(getBaseApiUrl(), ensureLeadingSlash(path));
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Kapital API error: ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

const createOrder = async ({
  amountMinor,
  currency = Number(process.env.KAPITAL_TEST_CURRENCY || 944),
  language = (process.env.KAPITAL_TEST_LANGUAGE || "EN").toUpperCase(),
  description,
  approveUrl,
  declineUrl,
  cancelUrl,
  callbackUrl,
  orderTypeRid = process.env.KAPITAL_TEST_ORDER_TYPE_RID || "Order_SMS",
}) => {
  const payload = mapCreateOrderPayload({
    amountMinor,
    currency,
    language,
    description,
    approveUrl,
    declineUrl,
    cancelUrl,
    callbackUrl,
    orderTypeRid,
  });

  return doRequest(KAPITAL_TEST_CREATE_ORDER_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

const getOrderDetails = async (gatewayOrderId) => {
  const path = KAPITAL_TEST_GET_ORDER_PATH_TEMPLATE.replace("{orderId}", gatewayOrderId);
  return doRequest(path, { method: "GET" });
};

module.exports = {
  createOrder,
  getOrderDetails,
};
