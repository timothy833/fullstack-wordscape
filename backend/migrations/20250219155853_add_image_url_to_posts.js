/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable("posts", function (table) {
        table.string("image_url").nullable(); // 新增 image_url 欄位，允許為 NULL
    });
};
  
 
  

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable("posts", function (table) {
        table.dropColumn("image_url"); // 如果 rollback，則移除欄位
    });
};