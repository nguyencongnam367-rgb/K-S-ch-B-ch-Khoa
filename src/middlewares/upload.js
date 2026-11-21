const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { COVER_MAX_SIZE } = require('../config/constants');

const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => (
  extensions[file.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Chỉ chấp nhận ảnh JPG, PNG, WEBP'))
);

const single = multer({ storage, fileFilter, limits: { fileSize: COVER_MAX_SIZE } }).single('cover');

// Nhận file ảnh bìa ở trường "cover" (multipart/form-data); JSON thường vẫn đi qua bình thường
function uploadCover(req, res, next) {
  single(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      return next(new ApiError(400, error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh bìa tối đa 2 MB' : error.message));
    }
    return next(error);
  });
}

module.exports = uploadCover;
