const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get shop status
exports.getShopStatus = async (req, res) => {
  try {
    const [results] = await db.query('SELECT value FROM settings WHERE `key` = "shop_status"');
    if (results.length === 0) return res.json({ status: 'open' }); // default
    res.json({ status: results[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Set shop status
exports.setShopStatus = async (req, res) => {
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query(
      'UPDATE settings SET value = ? WHERE `key` = "shop_status"',
      [status]
    );
    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

