/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.string("phone").nullable(); // 手機號碼
    table.enum("gender", ["男", "女", "其他"]).defaultTo("其他"); // 性別
    table.date("birthday").nullable(); // 生日
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.dropColumn("phone");
    table.dropColumn("gender");
    table.dropColumn("birthday");
  });
};
