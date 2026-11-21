const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parsePaging(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  return { page, limit, skip: (page - 1) * limit };
}

// Tìm kiếm - lọc - sắp xếp - phân trang cho mọi API danh sách
class APIFeatures {
  constructor(Model, queryString = {}, baseFilter = {}) {
    this.Model = Model;
    this.queryString = queryString;
    this.filterObj = { ...baseFilter };
    this.sortObj = { createdAt: -1 };
    this.paging = parsePaging(queryString);
  }

  // q: tìm gần đúng (không phân biệt hoa thường) trên các trường cho phép
  search(fields) {
    const q = String(this.queryString.q || '').trim();
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      const clause = fields.map((field) => ({ [field]: regex }));
      this.filterObj = { ...this.filterObj, $and: [...(this.filterObj.$and || []), { $or: clause }] };
    }
    return this;
  }

  // Lọc bằng đúng giá trị; nhiều giá trị ngăn cách bằng dấu phẩy => $in
  filter(allowed) {
    allowed.forEach((field) => {
      const raw = this.queryString[field];
      if (raw === undefined || raw === '') return;
      const values = String(raw).split(',').filter(Boolean);
      this.filterObj[field] = values.length > 1 ? { $in: values } : values[0];
    });
    return this;
  }

  // sort=-createdAt,title (dấu - là giảm dần); chỉ nhận các trường cho phép
  sort(allowed, fallback = '-createdAt') {
    const raw = String(this.queryString.sort || fallback);
    const sort = {};
    raw.split(',').forEach((part) => {
      const desc = part.startsWith('-');
      const field = part.replace(/^-/, '');
      if (allowed.includes(field)) sort[field] = desc ? -1 : 1;
    });
    this.sortObj = Object.keys(sort).length ? sort : { createdAt: -1 };
    return this;
  }

  async exec({ populate, select, lean = false } = {}) {
    const { page, limit, skip } = this.paging;
    const total = await this.Model.countDocuments(this.filterObj);
    let query = this.Model.find(this.filterObj).sort(this.sortObj).skip(skip).limit(limit);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    const data = await query;
    return { data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }
}

// Tạo các liên kết phân trang cho trang web: giữ nguyên các tham số lọc khác
function pageLinks(basePath, query, pagination) {
  const { page, totalPages, total } = pagination;
  const hrefFor = (target) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'page' && value !== undefined && value !== '') params.set(key, value);
    });
    if (target > 1) params.set('page', target);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const numbers = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n += 1) numbers.push(n);

  const links = [];
  if (page > 1) links.push({ label: '‹', href: hrefFor(page - 1), aria: 'Trang trước' });
  numbers.forEach((n) => links.push({ label: String(n), href: hrefFor(n), active: n === page }));
  if (page < totalPages) links.push({ label: '›', href: hrefFor(page + 1), aria: 'Trang sau' });

  return { page, totalPages, total, links };
}

module.exports = { APIFeatures, escapeRegex, parsePaging, pageLinks };
