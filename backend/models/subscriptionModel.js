const db = require('../db');

exports.toggleSubscription = async (user_id, subscribed_to) => {
  try {
    const checkResult = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND subscribed_to = $2;`,
      [user_id, subscribed_to]
    );

    if (checkResult.rows.length > 0) {
      await db.query(`DELETE FROM subscriptions WHERE user_id = $1 AND subscribed_to = $2;`,
        [user_id, subscribed_to]);
      return { subscribed: false };
    } else {
      await db.query(
        `INSERT INTO subscriptions (id, user_id, subscribed_to, created_at) 
                 VALUES (gen_random_uuid(), $1, $2, NOW());`,
        [user_id, subscribed_to]
      );
      return { subscribed: true };
    }
  } catch (error) {
    throw error;
  }
};

exports.getSubscriptionsByUser = async (user_id) => {
  try {
    const result = await db.query(
      `SELECT subscriptions.subscribed_to AS user_id, users.username 
             FROM subscriptions 
             JOIN users ON subscriptions.subscribed_to = users.id
             WHERE subscriptions.user_id = $1;`,
      [user_id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

exports.getFollowersByUser = async (user_id) => {
  try {
    const result = await db.query(
      `SELECT subscriptions.user_id, users.username 
             FROM subscriptions 
             JOIN users ON subscriptions.user_id = users.id
             WHERE subscriptions.subscribed_to = $1;`,
      [user_id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};
