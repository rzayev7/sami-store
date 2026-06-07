const Lead = require("../models/Lead");
const {
  normalizeLeadPhone,
  countryFromRequest,
  resolveLeadCountry,
} = require("../utils/leadPhone");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createLead = async (req, res, next) => {
  try {
    // Honeypot — bots fill hidden fields; humans leave empty.
    const honeypot = String(req.body?.website || req.body?._hp || "").trim();
    if (honeypot) {
      return res.status(200).json({ ok: true });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();
    const rawWhatsapp = String(req.body?.whatsapp || "").trim();
    const source = String(req.body?.source || "popup").trim().slice(0, 40);
    const language = String(req.body?.language || "en").trim().toLowerCase().slice(0, 5);
    const page = String(req.body?.page || "").trim().slice(0, 200);

    const hasEmail = email && EMAIL_RE.test(email);
    const phone = normalizeLeadPhone(rawWhatsapp);
    const hasWhatsApp = phone.valid;

    if (!hasEmail && !hasWhatsApp) {
      return res.status(400).json({
        message: "Please provide a valid email or WhatsApp number with country code (e.g. +994…).",
      });
    }

    const reqCountry = countryFromRequest(req);
    const country = resolveLeadCountry({
      phoneCountry: phone.countryFromPhone,
      reqCountry,
    });

    if (hasEmail) {
      const existing = await Lead.findOne({ email });
      if (existing) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
    }

    if (hasWhatsApp) {
      const existingWa = await Lead.findOne({ whatsappNormalized: phone.digits });
      if (existingWa) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
    }

    const lead = await Lead.create({
      email: hasEmail ? email : "",
      whatsapp: hasWhatsApp ? phone.e164 : "",
      whatsappNormalized: hasWhatsApp ? phone.digits : "",
      source,
      language,
      country,
      page,
    });

    res.status(201).json({ ok: true, id: lead._id });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments({}),
    ]);

    res.json({ leads, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const exportLeadsCsv = async (req, res, next) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();

    const header = "Email,WhatsApp,Source,Language,Country,Page,Date\n";
    const rows = leads.map((l) => {
      const date = new Date(l.createdAt).toISOString().slice(0, 10);
      const escape = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
      return [l.email, l.whatsapp, l.source, l.language, l.country, l.page, date]
        .map(escape)
        .join(",");
    });

    const csv = header + rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="sami-leads.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = { createLead, getLeads, exportLeadsCsv };
