/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return  knex.schema.alterTable("posts", function (table) {
    table.text("description").nullable();    // 新增 description 欄位，允許為 NULL
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable("posts", function(table){
        table.dropColumn("description") //rollback 時刪除欄位
    });
};
