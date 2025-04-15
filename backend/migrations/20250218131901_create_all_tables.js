/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 啟用 uuid-ossp 擴展 (用於 UUID 主鍵)
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  
    // 建立 users 資料表
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('username', 50).unique().notNullable();
      table.string('email', 100).unique().notNullable();
      table.text('password').notNullable();
      table.text('bio');
      table.text('profile_picture');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  
    // 建立 categories (分類)
    await knex.schema.createTable('categories', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).unique().notNullable();
    });
  
    // 建立 posts (文章)
    await knex.schema.createTable('posts', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
      table.string('title', 225).notNullable();
      table.text('content').notNullable();
      table.string('status', 50).defaultTo('draft');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  
    // 建立 comments (評論)
    await knex.schema.createTable('comments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.uuid('parent_comment_id').references('id').inTable('comments'); // 巢狀評論
      table.text('content').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // 新增 updated_at 欄位
    });
  
    // 建立 payments (付款紀錄)
    await knex.schema.createTable('payments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users');
      table.decimal('amount', 10, 2).notNullable();
      table.string('status', 50).defaultTo('draft');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  
    // 建立 subscriptions (訂閱關係)
    await knex.schema.createTable('subscriptions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('subscribed_to').references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  
    // 建立 tags (標籤)
    await knex.schema.createTable('tags', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).unique().notNullable();
    });
  
    // 建立 post_tags (文章與標籤的多對多關聯)
    await knex.schema.createTable('post_tags', (table) => {
      table.uuid('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.uuid('tag_id').references('id').inTable('tags').onDelete('CASCADE');
      table.primary(['post_id', 'tag_id']);
    });
  
    // 建立 post_likes (文章按讚記錄)
    await knex.schema.createTable('post_likes', (table) => {
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.primary(['user_id', 'post_id']); // 避免重複按讚
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('post_tags');
    await knex.schema.dropTableIfExists('tags');
    await knex.schema.dropTableIfExists('subscriptions');
    await knex.schema.dropTableIfExists('payments');
    await knex.schema.dropTableIfExists('post_likes');
    await knex.schema.dropTableIfExists('comments');
    await knex.schema.dropTableIfExists('posts');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('users');
  };
  