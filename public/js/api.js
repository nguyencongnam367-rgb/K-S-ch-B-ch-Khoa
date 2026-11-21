// Máy khách gọi API /api/v1: tự gửi cookie phiên, ném lỗi kèm thông báo của máy chủ
const api = (() => {
  const BASE = '/api/v1';

  async function request(method, path, body) {
    const options = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };

    if (body instanceof FormData) {
      options.body = body; // trình duyệt tự đặt Content-Type multipart
    } else if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(BASE + path, options);
    } catch (error) {
      throw new Error('Không thể kết nối đến máy chủ.');
    }

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok || (data && data.success === false)) {
      const failure = new Error((data && data.message) || 'Không thể xử lý yêu cầu.');
      failure.status = response.status;
      failure.errors = data && data.errors;
      throw failure;
    }
    return data;
  }

  return {
    request,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body ?? {}),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body ?? {}),
    delete: (path) => request('DELETE', path)
  };
})();

window.api = api;
