var express = require('express');
var router = express.Router();
var blogCategory = require('./../../models/blog-category');
var blogPost = require('./../../models/blog-post');

router.get('/categories', function (req, res, next) {
    var data = {"data": []};

    blogCategory.find((v=>true)).forEach((category)=> {
        data.data.push(blogCategory.normalize(category));
    });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));
});

router.get('/posts', function (req, res, next) {
    var data = {"data": [], "included": []};
    var categoryId = req.query.categoryId;
    var posts = blogPost.find((post=>categoryId ? categoryId + "" === post.categoryId + "" : true));
    var categoriesMap = {};

    posts.forEach((post)=> {
        categoriesMap[post.categoryId + ""] = null;
        data.data.push(blogPost.normalize(post));

        for (var key in categoriesMap) {
            var category = blogCategory.find((category=>category.id + "" === key + ""));
            data.included.push(blogCategory.normalize(category[0]));
        }
    });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));
});

router.get('/posts/:id', function (req, res, next) {
    var data = {"data": {}, "included": []};
    var postId = req.params.id;
    var posts = blogPost.find((post=>post.id + "" === postId + ""));
    var post = posts.length ? posts[0] : null;

    if (post) {
        data.data = blogPost.normalize(post);

        var category = blogCategory.find((category=>category.id + "" === post.categoryId + ""));
        data.included.push(blogCategory.normalize(category[0]));
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));
});

router.get('/posts/:id/content', function (req, res, next) {
    var data = {"data": {}};
    var postId = req.params.id;
    var posts = blogPost.find((post=>post.id + "" === postId + ""));
    var post = posts.length ? posts[0] : null;

    if (post) {
        data.data = {
            "type": "blog-post-content",
            "id": post.id,
            "attributes": {
                "content": post.content
            }
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));
});

module.exports = router;
