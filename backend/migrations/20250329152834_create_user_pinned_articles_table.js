/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('user_pinned_articles', (table) => {
      table.uuid('user_id').notNullable();
      table.uuid('post_id').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.primary(['user_id', 'post_id']); // 多對多關聯主鍵
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('post_id').references('id').inTable('posts').onDelete('CASCADE');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('user_pinned_articles');
  };
  