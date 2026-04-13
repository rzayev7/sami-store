const crypto = require("crypto");

const toBase64 = (value) => Buffer.from(value, "utf8").toString("base64");

const buildData = (payload) => {
  return toBase64(JSON.stringify(payload));
};

const signData = ({ data, privateKey }) => {
  if (!privateKey) {
    throw new Error("Epoint private key is not configured");
  }
  const digest = crypto
    .createHash("sha1")
    .update(`${privateKey}${data}${privateKey}`, "utf8")
    .digest();
  return Buffer.from(digest).toString("base64");
};

const buildSignedRequest = ({ payload, privateKey }) => {
  const data = buildData(payload);
  const signature = signData({ data, privateKey });
  return { data, signature };
};

const verifySignature = ({ data, signature, privateKey }) => {
  if (!data || !signature) return false;
  const expected = signData({ data, privateKey });
  return expected === signature;
};

const decodeData = (data) => {
  const decoded = Buffer.from(String(data || ""), "base64").toString("utf8");
  return JSON.parse(decoded);
};

module.exports = {
  buildSignedRequest,
  verifySignature,
  decodeData,
};
