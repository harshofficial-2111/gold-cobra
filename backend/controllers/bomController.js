const db = require("../config/db");

// ==============================================
// GET Bill Of Materials by Road
// GET /api/bom?road=M.%20G.%20Road
// ==============================================
exports.getBom = async (req, res) => {
  try {
    const { road } = req.query;

    if (!road) {
      return res.status(400).json({
        success: false,
        message: "Road name is required."
      });
    }

    const roadResult = await db.query(
      "SELECT id FROM roads WHERE road_name = $1",
      [road]
    );

    if (roadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Road not found."
      });
    }

    const roadId = roadResult.rows[0].id;

    const result = await db.query(
      `
      SELECT
        id,
        item_description AS item,
        item_category AS type,
        technical_specs AS specs,
        quantity AS qty,
        unit,
        unit_rate,
        total_cost,
        status_remarks AS status
      FROM bill_of_materials
      WHERE road_id = $1
      ORDER BY id;
      `,
      [roadId]
    );

    res.json({
      success: true,
      bom: result.rows
    });

  } catch (err) {
    console.error("BOM Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================================
// GET Single BOM Item with Detailed Logs
// GET /api/bom/:id
// ==============================================
exports.getBomById = async (req, res) => {
  try {
    const { id } = req.params;

    const bomResult = await db.query(
      `
      SELECT
        id,
        road_id,
        item_description AS item,
        item_category AS type,
        technical_specs AS specs,
        quantity AS qty,
        unit,
        unit_rate,
        total_cost,
        status_remarks AS status
      FROM bill_of_materials
      WHERE id = $1;
      `,
      [id]
    );

    if (bomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "BOM item not found." });
    }

    const logsResult = await db.query(
      `
      SELECT 
        id,
        bom_id,
        log_date AS date,
        quantity AS qty,
        unit_count AS count,
        number_plate AS "numberPlate",
        unit_rate AS "unitRate",
        total_cost AS "totalCost"
      FROM bom_logs
      WHERE bom_id = $1
      ORDER BY log_date DESC, id DESC;
      `,
      [id]
    );

    res.json({
      success: true,
      bom: bomResult.rows[0],
      logs: logsResult.rows
    });
  } catch (err) {
    console.error("Get BOM Details Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================================
// ADD BOM Item
// POST /api/bom
// ==============================================
exports.addBom = async (req, res) => {
  try {
    const {
      road,
      item,
      type,
      specs,
      qty,
      unit,
      unitRate,
      totalCost,
      status
    } = req.body;

    const roadResult = await db.query(
      "SELECT id FROM roads WHERE road_name = $1",
      [road]
    );

    if (roadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Road not found."
      });
    }

    const roadId = roadResult.rows[0].id;

    const result = await db.query(
      `
      INSERT INTO bill_of_materials
      (
        road_id,
        item_description,
        item_category,
        technical_specs,
        quantity,
        unit,
        unit_rate,
        total_cost,
        status_remarks
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      RETURNING *;
      `,
      [
        roadId,
        item,
        type,
        specs,
        qty,
        unit,
        unitRate || 0,
        totalCost || 0,
        status
      ]
    );

    res.status(201).json({
      success: true,
      message: "BOM item added successfully.",
      bom: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================================
// UPDATE BOM Item
// PUT /api/bom/:id
// ==============================================
exports.updateBom = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item,
      type,
      specs,
      qty,
      unit,
      unitRate,
      totalCost,
      status
    } = req.body;

    const result = await db.query(
      `
      UPDATE bill_of_materials
      SET
        item_description = $1,
        item_category = $2,
        technical_specs = $3,
        quantity = $4,
        unit = $5,
        unit_rate = $6,
        total_cost = $7,
        status_remarks = $8
      WHERE id = $9
      RETURNING *;
      `,
      [
        item,
        type,
        specs,
        qty,
        unit,
        unitRate || 0,
        totalCost || 0,
        status,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "BOM item not found."
      });
    }

    res.json({
      success: true,
      message: "BOM updated successfully.",
      bom: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================================
// DELETE BOM Item
// DELETE /api/bom/:id
// ==============================================
exports.deleteBom = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM bill_of_materials WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "BOM item not found."
      });
    }

    res.json({
      success: true,
      message: "BOM item deleted successfully."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================================
// ADD Detailed Log Entry for BOM Item
// POST /api/bom/:id/logs
// Now supports: count x quantity x unitRate, plus an optional
// Number Plate list (up to 50 plates) for equipment-type items.
// ==============================================
exports.addBomLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, qty, unitRate, count, numberPlate } = req.body;

    if (!date || qty === undefined || qty === null) {
      return res.status(400).json({ success: false, message: "Date and quantity are required." });
    }

    const unitCount = count == null || count === "" ? 1 : Number(count);

    // Cap by PLATE COUNT (max 50 plates), not by character length —
    // the previous `.slice(0, 50)` truncated the whole string at 50
    // characters, which cut plate lists off mid-plate. bom_logs.number_plate
    // is now TEXT, so there's no DB-side length limit to worry about.
    const MAX_PLATES = 50;
    let plate = null;
    if (numberPlate) {
      const plates = numberPlate
        .toString()
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, MAX_PLATES);

      plate = plates.length ? plates.join(", ") : null;
    }

    const logResult = await db.query(
      `
      INSERT INTO bom_logs (bom_id, log_date, quantity, unit_rate, unit_count, number_plate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, bom_id, log_date AS date, quantity AS qty, unit_count AS count, number_plate AS "numberPlate", unit_rate AS "unitRate", total_cost AS "totalCost";
      `,
      [id, date, qty, unitRate || 0, unitCount, plate]
    );

    await db.query(
      `
      UPDATE bill_of_materials
      SET 
        quantity = (SELECT COALESCE(SUM(quantity * unit_count), 0) FROM bom_logs WHERE bom_id = $1),
        total_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM bom_logs WHERE bom_id = $1)
      WHERE id = $1;
      `,
      [id]
    );

    res.status(201).json({
      success: true,
      message: "Log entry added successfully.",
      log: logResult.rows[0]
    });
  } catch (err) {
    console.error("Add Log Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================================
// DELETE Detailed Log Entry
// DELETE /api/bom/logs/:logId
// ==============================================
exports.deleteBomLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const logCheck = await db.query("SELECT bom_id FROM bom_logs WHERE id = $1", [logId]);
    if (logCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Log entry not found." });
    }

    const bomId = logCheck.rows[0].bom_id;

    await db.query("DELETE FROM bom_logs WHERE id = $1", [logId]);

    await db.query(
      `
      UPDATE bill_of_materials
      SET 
        quantity = (SELECT COALESCE(SUM(quantity * unit_count), 0) FROM bom_logs WHERE bom_id = $1),
        total_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM bom_logs WHERE bom_id = $1)
      WHERE id = $1;
      `,
      [bomId]
    );

    res.json({ success: true, message: "Log entry deleted successfully." });
  } catch (err) {
    console.error("Delete Log Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};