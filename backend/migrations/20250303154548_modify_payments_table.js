/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable("payments", function (table) {
    table.dropColumn("status"); // 移除 status 欄位
    table.uuid("receiver_id").references("id").inTable("users").onDelete("CASCADE"); // 新增 receiver_id
  });
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function (knex) {
  return knex.schema.alterTable("payments", function (table) {
    table.string("status", 50).defaultTo("pending");
    table.dropColumn("receiver_id");
  });
};
