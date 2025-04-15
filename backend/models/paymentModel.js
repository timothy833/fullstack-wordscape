const db = require('../db');

exports.createPayment = async (user_id, receiver_id, amount) => {
  try {
    const result = await db.query(`
      INSERT INTO payments (id, user_id, receiver_id, amount, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *;
    `, [user_id, receiver_id, amount]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.getAllPayments = async () => {
  try {
    const result = await db.query(`SELECT * FROM payments ORDER BY created_at DESC;`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};


exports.getPaymentsSentByUser = async (user_id) => {
  try {
    const result = await db.query(`
      SELECT payments.*, users.username AS receiver_name 
      FROM payments 
      JOIN users ON payments.receiver_id = users.id
      WHERE payments.user_id = $1 
      ORDER BY payments.created_at DESC;
    `, [user_id]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

exports.getPaymentsReceivedByUser = async (user_id) => {
  try {
    const result = await db.query(`
      SELECT payments.*, users.username AS sender_name 
      FROM payments 
      JOIN users ON payments.user_id = users.id
      WHERE payments.receiver_id = $1 
      ORDER BY payments.created_at DESC;
    `, [user_id]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};