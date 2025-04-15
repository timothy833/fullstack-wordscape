const db = require('../db');

exports.getPosts = async () => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, 
             users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(DISTINCT post_likes.user_id) AS likes_count,
             COUNT(DISTINCT post_favorites.user_id) AS favorites_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      LEFT JOIN post_favorites ON posts.id = post_favorites.post_id
      GROUP BY posts.id, users.username, categories.id, categories.name
      ORDER BY posts.created_at DESC;
    `);

    const posts = postResult.rows;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};


exports.getPostById = async (id) => {
  try {
    // 先增加點閱數（views_count +1）
    await db.query(`
      UPDATE posts 
      SET views_count = views_count + 1
      WHERE id = $1;
  `, [id]);
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(DISTINCT post_likes.user_id) AS likes_count,
             COUNT(DISTINCT post_favorites.user_id) AS favorites_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
       LEFT JOIN post_favorites ON posts.id = post_favorites.post_id
      WHERE posts.id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [id]);

    if (postResult.rows.length === 0) return null;
    const post = postResult.rows[0];

    // 取得 `tags`
    const tagResult = await db.query(`
      SELECT tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = $1;
    `, [id]);

    post.tags = tagResult.rows;

    // 取得 `liked_users`
    // const likedUsersResult = await db.query(`
    //   SELECT users.id, users.username
    //   FROM post_likes
    //   JOIN users ON post_likes.user_id = users.id
    //   WHERE post_likes.post_id = $1;
    // `, [id]);

    // post.liked_users = likedUsersResult.rows;

    return post;
  } catch (error) {
    throw error;
  }
};

exports.getPostsByCategory = async (categoryId) => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(DISTINCT post_likes.user_id) AS likes_count,
             COUNT(DISTINCT post_favorites.user_id) AS favorites_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
       LEFT JOIN post_favorites ON posts.id = post_favorites.post_id
      WHERE posts.category_id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [categoryId]);

    const posts = postResult.rows;

    if (posts.length === 0) return posts;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};


exports.getPostsByUser = async (userId) => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(DISTINCT post_likes.user_id) AS likes_count,
             COUNT(DISTINCT post_favorites.user_id) AS favorites_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      LEFT JOIN post_favorites ON posts.id = post_favorites.post_id
      WHERE posts.user_id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [userId]);

    const posts = postResult.rows;
    if (posts.length === 0) return posts;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    // 組織 `tags` 進入 `posts`
    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};




exports.getFullPostsWithComments = async () => {
  try {
    // 取得所有文章資訊
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(DISTINCT post_likes.user_id) AS likes_count,
             COUNT(DISTINCT post_favorites.user_id) AS favorites_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      LEFT JOIN post_favorites ON posts.id = post_favorites.post_id
      GROUP BY posts.id, users.username, categories.id, categories.name
      ORDER BY posts.created_at DESC;
    `);

    const posts = postResult.rows;

    if (posts.length === 0) return posts;

    // 取得所有文章的 ID
    const postIds = posts.map(post => post.id);

    // 查詢這些文章的留言（包含巢狀留言）
    const commentResult = await db.query(`
      SELECT comments.*, 
      users.username AS user_name,
      users.profile_picture,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS likes_count
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ANY($1)
      ORDER BY comments.created_at ASC;
    `, [postIds]);

    const comments = commentResult.rows;

    // 建立留言的巢狀結構
    const commentMap = {};
    comments.forEach(comment => commentMap[comment.id] = { ...comment, replies: [] });

    const nestedComments = {};
    comments.forEach(comment => {
      if (!nestedComments[comment.post_id]) nestedComments[comment.post_id] = [];
      if (comment.parent_comment_id) {
        commentMap[comment.parent_comment_id]?.replies.push(commentMap[comment.id]);
      } else {
        nestedComments[comment.post_id].push(commentMap[comment.id]);
      }
    });

    // 查詢文章標籤
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    // 合併文章與留言
    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
      post.comments = nestedComments[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};





exports.createPost = async (postData, tagNames) => {
  try {
    const postResult = await db.query(`
          INSERT INTO posts (id, user_id, category_id, title, content, description, status, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
      `, [postData.id, postData.user_id, postData.category_id, postData.title, postData.content, postData.description, postData.status, postData.image_url]);

    const post = postResult.rows[0];

    if (tagNames && tagNames.length > 0) {
      const tags = await exports.addTagsToPost(post.id, tagNames);
      post.tags = tags;
    } else {
      post.tags = [];
    }

    return post;
  } catch (error) {
    throw error;
  }
};

exports.updatePost = async (id, data) => {
  try {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (data[key]) {
        fields.push(`${key} = $${index}`);
        values.push(data[key]);
        index++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(`
          UPDATE posts SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;
      `, values);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};


exports.updatePostStatus = async (id, status) => {
  try {
    // 🔍 **先檢查文章是否存在**
    const postResult = await db.query(`SELECT * FROM posts WHERE id = $1;`, [id]);
    if (postResult.rows.length === 0) return null; // ❌ 文章不存在

    // ✅ **更新文章狀態**
    const updateResult = await db.query(
      `UPDATE posts SET status = $1 WHERE id = $2 RETURNING *;`,
      [status, id]
    );

    return updateResult.rows[0]; // 返回更新後的文章
  } catch (error) {
    throw new Error("❌ 更新文章狀態失敗：" + error.message);
  }
};


exports.deletePost = async (id) => {
  await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
};

exports.addTagsToPost = async (post_id, tag_names) => {
  try {
    // 取得現有的 tags
    const existingTagsResult = await db.query(`
          SELECT id, name FROM tags WHERE name = ANY($1);
      `, [tag_names]);
    const existingTags = existingTagsResult.rows;

    // 找出需要新增的 tags
    const existingTagNames = existingTags.map(tag => tag.name);
    const newTagNames = tag_names.filter(name => !existingTagNames.includes(name));

    // 插入新的 tags
    let newTags = [];
    if (newTagNames.length > 0) {
      const newTagsResult = await db.query(`
              INSERT INTO tags (name)
              SELECT unnest($1::text[]) RETURNING id, name;
          `, [newTagNames]);
      newTags = newTagsResult.rows;
    }

    const allTags = [...existingTags, ...newTags];

    // 插入 post_tags 關聯
    const tagIds = allTags.map(tag => tag.id);
    await db.query(`
          INSERT INTO post_tags (post_id, tag_id)
          SELECT $1, unnest($2::uuid[]);
      `, [post_id, tagIds]);

    return allTags;
  } catch (error) {
    throw error;
  }
};

exports.searchPostsByTags = async (tag_names) => {
  try {
    const postsResult = await db.query(`
          SELECT DISTINCT posts.*, users.username AS author_name
          FROM posts
          JOIN users ON posts.user_id = users.id
          JOIN post_tags ON posts.id = post_tags.post_id
          JOIN tags ON post_tags.tag_id = tags.id
          WHERE tags.name = ANY($1)
          ORDER BY posts.created_at DESC;
      `, [tag_names]);

    const posts = postsResult.rows;
    if (posts.length === 0) return posts;

    // 取得 tags
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
          SELECT post_tags.post_id, tags.id, tags.name
          FROM tags
          JOIN post_tags ON tags.id = post_tags.tag_id
          WHERE post_tags.post_id = ANY($1);
      `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};

exports.togglePostLike = async (userId, postId) => {
  try {
    const likeCheck = await db.query(
      `SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2;`,
      [userId, postId]
    );

    if (likeCheck.rows.length > 0) {
      await db.query(`DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2;`, [userId, postId]);
      return { liked: false };
    } else {
      await db.query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)  ON CONFLICT (user_id, post_id) DO NOTHING`, [userId, postId]);
      return { liked: true };
    }
  } catch (error) {
    throw error;
  }
};


exports.getPostLikes = async (post_id) => {
  try {
    const result = await db.query(`
          SELECT users.id, users.username
          FROM post_likes
          JOIN users ON post_likes.user_id = users.id
          WHERE post_likes.post_id = $1;
      `, [post_id]);

    return result.rows;
  } catch (error) {
    throw error;
  }
};


exports.togglePostFavorite = async (user_id, post_id) => {
  try {
    const checkResult = await db.query(
      `SELECT * FROM post_favorites WHERE user_id = $1 AND post_id = $2;`,
      [user_id, post_id]
    );

    if (checkResult.rows.length > 0) {
      await db.query(`DELETE FROM post_favorites WHERE user_id = $1 AND post_id = $2;`,
        [user_id, post_id]);
      return { favorited: false };
    } else {
      await db.query(
        `INSERT INTO post_favorites (user_id, post_id, created_at) VALUES ($1, $2, NOW());`,
        [user_id, post_id]
      );
      return { favorited: true };
    }
  } catch (error) {
    throw error;
  }
};


exports.getUserFavorites = async (user_id) => {
  try {
    const result = await db.query(`
          SELECT posts.*, users.username AS author_name,
          COALESCE(likes_count.count, 0) AS likes_count,
          COALESCE(fav_count.count, 0) AS favorites_count,
           COALESCE(comments_count.count, 0) AS comments_count
          FROM post_favorites
          JOIN posts ON post_favorites.post_id = posts.id
          JOIN users ON posts.user_id = users.id
           LEFT JOIN (
          SELECT post_id, COUNT(user_id) AS count
          FROM post_likes
          GROUP BY post_id
      ) AS likes_count ON posts.id = likes_count.post_id
          LEFT JOIN (
              SELECT post_id, COUNT(user_id) AS count
              FROM post_favorites
              GROUP BY post_id
          ) AS fav_count ON posts.id = fav_count.post_id
           LEFT JOIN ( 
          SELECT post_id, COUNT(id) AS count
          FROM comments
          GROUP BY post_id
      ) AS comments_count ON posts.id = comments_count.post_id
          WHERE post_favorites.user_id = $1
          ORDER BY post_favorites.created_at DESC;
      `, [user_id]);

    return result.rows;
  } catch (error) {
    throw error;
  }
};


// 取得某個 user 的釘選文章 ID
exports.getPinnedPostsByUser = async (userId) => {
  try {
    const result = await db.query(
      `SELECT post_id FROM user_pinned_articles WHERE user_id = $1;`,
      [userId]
    );

    return result.rows.map((row) => row.post_id); // 空陣列也會回 []
  } catch (error) {
    console.error('❌ 查詢 user_pinned_articles 發生錯誤:', error);
    throw error;
  }
};

// 檢查某篇文章是否被該 user 釘選
exports.isPostPinnedByUser = async (userId, postId) => {
  const result = await db.query(
    `SELECT 1 FROM user_pinned_articles WHERE user_id = $1 AND post_id = $2 LIMIT 1;`,
    [userId, postId]
  );
  return result.rows.length > 0;
};

// 新增釘選
exports.pinPostForUser = async (userId, postId) => {
  await db.query(
    `INSERT INTO user_pinned_articles (user_id, post_id, created_at) VALUES ($1, $2, NOW());`,
    [userId, postId]
  );
};

// 取消釘選
exports.unpinPostForUser = async (userId, postId) => {
  await db.query(
    `DELETE FROM user_pinned_articles WHERE user_id = $1 AND post_id = $2;`,
    [userId, postId]
  );
};
