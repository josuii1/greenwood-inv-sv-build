import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  database: process.env.MYSQL_DATABASE,
});

export async function getUserById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM invoices.users WHERE id = ?",
        [id]
      );
      resolve(rows);
      return rows;
    } catch (err) {
      console.error("Failed to verify", err);
      throw err; // or handle the error as needed
    }
  });
}

export async function registerNewUser(userData) {
  const { username, password } = userData;

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM invoices.users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO invoices.users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    return result;
  } catch (err) {
    throw new Error(`Server error: ${err.message}`);
  }
}

export async function getUserByUsername(username, callback) {
  console.log(username);

  try {
    const [rows] = await pool.query(
      "SELECT * FROM invoices.users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return callback(null, null);
    }

    const user = rows[0];
    callback(null, user);
  } catch (err) {
    callback(err, null);
  }
}

export async function comparePassword(inputPassword, userPassword, callback) {
  bcrypt.compare(inputPassword, userPassword, (err, isMatch) => {
    if (err) return callback(err, null);
    callback(null, isMatch);
  });
}

// Function to get all invoices from the database
export async function getInvoices() {
  try {
    const [invoices] = await pool.query(
      "SELECT * FROM invoices.invoices ORDER BY ID DESC"
    );
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export async function getEstimates() {
  try {
    const [estimates] = await pool.query(
      "SELECT * FROM invoices.estimates ORDER BY ID DESC"
    );
    return estimates;
  } catch (error) {
    console.error("Error fetching estimates:", error);
    throw error;
  }
}

// Function to insert a new invoice into the database
export async function insertInvoice(invoiceData) {
  try {
    const { invoiceNumber, customerName, invoiceDate, invoiceNotes, amount } =
      invoiceData;

    const query = `INSERT INTO invoices.invoices SET invoiceNumber = ?, customerName = ?, invoiceDate = ?, invoiceNotes = ?, amount = ?, accepted = 0, denied = 0`;

    const [result] = await pool.query(query, [
      invoiceNumber,
      customerName,
      invoiceDate,
      invoiceNotes,
      amount,
    ]);
    return result;
  } catch (error) {
    console.error("Error inserting invoice:", error);
    throw error;
  }
}

// Function to insert a new estimate into the database
export async function insertEstimate(estimateData) {
  try {
    const {
      estimateNumber,
      customerName,
      estimateDate,
      estimateNotes,
      amount,
    } = estimateData;

    const query = `INSERT INTO invoices.estimates SET estimateNumber = ?, customerName = ?, estimateDate = ?, estimateNotes = ?, amount = ?`;

    const [result] = await pool.query(query, [
      estimateNumber,
      customerName,
      estimateDate,
      estimateNotes,
      amount,
    ]);
    return result;
  } catch (error) {
    console.error("Error inserting invoice:", error);
    throw error;
  }
}

export async function deleteInvoice(id) {
  pool.query("DELETE FROM invoices WHERE id = ?", [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice deleted successfully" });
  });
}

export async function getInvoiceDetails(id) {
  try {
    const [invoices] = await pool.query(
      "SELECT * FROM invoices.invoices where id = ?",
      [id]
    );
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export async function getEstimateDetails(id) {
  try {
    const [estimate] = await pool.query(
      "SELECT * FROM invoices.estimates where estimateNumber = ?",
      [id]
    );
    return estimate;
  } catch (error) {
    console.error("Error fetching estimate:", error);
    throw error;
  }
}

export async function acceptEstimate(id) {
  try {
    const [estimate] = await pool.query(
      `UPDATE invoices.estimates SET accepted = 1 WHERE id = ?`,
      [id]
    );
    return estimate;
  } catch (error) {
    console.error("Error fetching estimate:", error);
    throw error;
  }
}

export async function getCurrentInvoiceNumber() {
  try {
    const [invoice] = await pool.query(
      "SELECT MAX(invoiceNumber) AS CurrentInvoicePlace FROM invoices.invoices"
    );
    return invoice;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export async function updateInvoice(invoiceData) {
  try {
    const {
      customerName,
      invoiceDate,
      invoiceNotes,
      paymentStatus,
      amount,
      id,
      invoiceNumber,
    } = invoiceData;

    const query = `UPDATE invoices.invoices SET customerName = ?, invoiceDate = ?, invoiceNotes = ?, paymentStatus = ?, amount = ? WHERE id = ? AND invoiceNumber = ?`;

    const [result] = await pool.query(query, [
      customerName,
      invoiceDate,
      invoiceNotes,
      paymentStatus,
      amount,
      id,
      invoiceNumber,
    ]);
    return result;
  } catch (error) {
    console.error("Error inserting invoice:", error);
    throw error;
  }
}
