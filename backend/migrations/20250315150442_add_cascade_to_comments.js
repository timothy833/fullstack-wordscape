/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async  function(knex) {
    await knex.schema.alterTable('comments', (table) => {
        table.dropForeign('parent_comment_id'); // 先移除外鍵約束
    });

    await knex.schema.alterTable('comments', (table) => {
        table.foreign('parent_comment_id') // 重新設定外鍵
            .references('id')
            .inTable('comments')
            .onDelete('CASCADE'); // ✅ 確保父留言刪除時，子留言自動刪除
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.alterTable('comments', (table) => {
        table.dropForeign('parent_comment_id'); // 先刪除 CASCADE
    });

    await knex.schema.alterTable('comments', (table) => {
        table.foreign('parent_comment_id') // 恢復原始外鍵（不帶 CASCADE）
            .references('id')
            .inTable('comments');
    });
};
