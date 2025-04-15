/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('banners', function(table) {
        table.text('image_url').alter();  // ✅ 修改 image_url 為 text
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('banners', function(table) {
        table.string('image_url').notNullable().alter(); // 回滾變更
    });
};
