/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("comment_likes", function (table) {
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.uuid("comment_id").references("id").inTable("comments").onDelete("CASCADE");
    table.primary(["user_id", "comment_id"]); // 避免重複按讚
  });
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("comment_likes");
};
