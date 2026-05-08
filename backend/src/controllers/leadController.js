const Lead = require("../models/Lead");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_RE = /^\+?[0-9\s\-().]{7,20}$/;

const createLead = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const whatsapp = String(req.body?.whatsapp || "").trim();
    const source = String(req.body?.source || "popup").trim().slice(0, 40);
    const language = String(req.body?.language || "en").trim().toLowerCase().slice(0, 5);
    const country = String(req.body?.country || "").trim().slice(0, 60);
    const page = String(req.body?.page || "").trim().slice(0, 200);

    const hasEmail = email && EMAIL_RE.test(email);
    const hasWhatsApp = whatsapp && WHATSAPP_RE.test(whatsapp);

    if (!hasEmail && !hasWhatsApp) {
      return res.status(400).json({
        message: "Please provide a valid email or WhatsApp number.",
      });
    }

    // Avoid duplicate email leads (silently succeed so UI can show thank-you).
    if (hasEmail) {
      const existing = await Lead.findOne({ email });
      if (existing) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
    }

    const lead = await Lead.create({
      email: hasEmail ? email : "",
      whatsapp: hasWhatsApp ? whatsapp : "",
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
