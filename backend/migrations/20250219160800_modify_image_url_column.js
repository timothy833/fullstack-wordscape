/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
    return knex.schema.alterTable("posts", function (table) {
      table.text("image_url").alter(); // 修改 image_url 為 TEXT
    });
  };
  

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable("posts", function (table) {
      table.string("image_url", 255).alter(); // 退回 VARCHAR(255)
    });
};