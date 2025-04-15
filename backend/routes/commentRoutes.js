const express = require('express');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', commentController.getAllComments);
router.get('/:post_id', commentController.getComments);
router.post('/', authMiddleware, commentController.createComment);
router.put('/:id', authMiddleware, commentController.updateComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

router.post('/comment_likes/:comment_id', authMiddleware, commentController.toggleCommentLike);
router.get('/comment_likes/:comment_id', commentController.getCommentLikes);

module.exports = router;
