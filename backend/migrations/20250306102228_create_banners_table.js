/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('banners', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('title').notNullable();
        table.string('subtitle');
        table.string('image_url').notNullable();
        table.timestamps(true, true);  // ✅ 這行會自動加入 `created_at` 和 `updated_at`
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('banners');
};
