const { buildSignedRequest } = require("../utils/epointSignature");

const EPOINT_BASE_URL = process.env.EPOINT_BASE_URL || "https://epoint.az";

const EPOINT_BANK_CODE_MESSAGES = {
  "000": "Confirmed",
  "100": "Rejected",
  "101": "Declined: card expired",
  "102": "Declined: suspected fraud",
  "104": "Declined: restricted card",
  "106": "Declined: PIN attempts exceeded",
  "109": "Declined: invalid merchant",
  "110": "Declined: incorrect amount",
  "111": "Declined: incorrect card number",
  "116": "Declined: insufficient funds",
  "117": "Declined: incorrect PIN",
  "119": "Declined: transaction not allowed by cardholder",
  "121": "Declined: withdrawal limit exceeded",
  "125": "Declined: card not valid",
  "200": "Pick-up: card blocked",
  "208": "Pick-up: lost card",
  "209": "Pick-up: stolen card",
  "902": "Invalid transaction",
  "904": "Format error",
  "909": "System failure",
  "916": "Incorrect MAC",
};

class EpointService {
  constructor({
    publicKey = process.env.EPOINT_PUBLIC_KEY,
    privateKey = process.env.EPOINT_PRIVATE_KEY,
    baseUrl = EPOINT_BASE_URL,
    defaultLanguage = (process.env.EPOINT_LANGUAGE || "en").toLowerCase(),
    defaultCurrency = (process.env.EPOINT_CURRENCY || "AZN").toUpperCase(),
  } = {}) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.defaultLanguage = defaultLanguage;
    this.defaultCurrency = defaultCurrency;
  }

  ensureConfig() {
    if (!this.publicKey || !this.privateKey) {
      throw new Error("Epoint credentials are not configured");
    }
  }

  describeBankCode(code) {
    return EPOINT_BANK_CODE_MESSAGES[String(code || "")] || "Bank response received";
  }

  async post(endpoint, payload) {
    this.ensureConfig();
    const signed = buildSignedRequest({
      payload: {
        ...payload,
        public_key: this.publicKey,
      },
      privateKey: this.privateKey,
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(signed),
    });

    const rawText = await response.text();
    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { raw: rawText };
    }

    if (!response.ok) {
      const message = data?.message || `Epoint API request failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  initiatePayment({
    amount,
    orderId,
    description = "",
    language = this.defaultLanguage,
    currency = this.defaultCurrency,
    successRedirectUrl,
    errorRedirectUrl,
  }) {
    return this.post("/api/1/request", {
      amount,
      currency,
      language,
      order_id: orderId,
      description,
      success_redirect_url: successRedirectUrl,
      error_redirect_url: errorRedirectUrl,
    });
  }

  checkStatus({ transaction }) {
    return this.post("/api/1/get-status", {
      transaction,
    });
  }

  reverse({ transaction, amount, currency = this.defaultCurrency, language = this.defaultLanguage }) {
    return this.post("/api/1/reverse", {
      transaction,
      amount,
      currency,
      language,
    });
  }

  refund({ cardId, orderId, amount, language = this.defaultLanguage, currency = this.defaultCurrency }) {
    return this.post("/api/1/refund-request", {
      card_id: cardId,
      order_id: orderId,
      amount,
      currency,
      language,
    });
  }

  chargeCard({
    cardId,
    orderId,
    amount,
    description = "",
    language = this.defaultLanguage,
    currency = this.defaultCurrency,
  }) {
    return this.post("/api/1/execute-pay", {
      card_id: cardId,
      order_id: orderId,
      amount,
      currency,
      language,
      description,
    });
  }
}

module.exports = {
  EpointService,
  EPOINT_BANK_CODE_MESSAGES,
};
