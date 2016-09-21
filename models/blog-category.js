var blogCategories = [{
    "id": 1,
    "name": "Ember",
    "post-count": 1
}];

exports.find = function (closure) {
    return blogCategories.filter(closure);
}

exports.normalize = function (category) {
    return {
        "type": "blog-category",
        "id": category.id,
        "attributes": {
            "name": category.name,
            "post-count": category['post-count']
        }
    };
}