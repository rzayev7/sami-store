const StoreSettings = require("../models/StoreSettings");

const DEFAULT_SHIPPING_FEE_USD = 18;
const GLOBAL_SETTINGS_KEY = "global";

const mapSettingsResponse = (doc) => ({
  shippingFeeUsd: Number(doc?.shippingFeeUsd ?? DEFAULT_SHIPPING_FEE_USD),
});

const getStoreSettings = async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne({ key: GLOBAL_SETTINGS_KEY }).lean();
    res.status(200).json(mapSettingsResponse(settings));
  } catch (error) {
    next(error);
  }
};

const updateStoreSettings = async (req, res, next) => {
  try {
    const shippingFeeUsd = Number(req.body?.shippingFeeUsd);

    if (!Number.isFinite(shippingFeeUsd) || shippingFeeUsd < 0) {
      return res.status(400).json({ message: "shippingFeeUsd must be a non-negative number" });
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: GLOBAL_SETTINGS_KEY },
      { $set: { shippingFeeUsd } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(mapSettingsResponse(settings));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};
