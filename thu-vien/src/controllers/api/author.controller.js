const Author = require('../../models/author.model');
const createTaxonomyController = require('./taxonomy.factory');

module.exports = createTaxonomyController({ Model: Author, field: 'author', label: 'Tác giả', descField: 'bio' });
