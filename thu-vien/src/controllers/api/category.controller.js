const Category = require('../../models/category.model');
const createTaxonomyController = require('./taxonomy.factory');

module.exports = createTaxonomyController({ Model: Category, field: 'category', label: 'Thể loại', descField: 'description' });
