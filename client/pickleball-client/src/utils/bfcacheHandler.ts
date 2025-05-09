/**
 * Xử lý các vấn đề liên quan đến Back/Forward Cache (bfcache)
 *
 * File này chứa các hàm để xử lý các vấn đề liên quan đến bfcache,
 * đặc biệt là lỗi "Unchecked runtime.lastError: The page keeping the extension port is moved into back/forward cache"
 */

/**
 * Thiết lập các trình xử lý sự kiện cho bfcache
 * - pageshow: Khi trang được hiển thị (có thể từ bfcache)
 * - pagehide: Khi trang bị ẩn (có thể đưa vào bfcache)
 */
export function setupBFCacheHandlers() {
  // Xử lý khi trang được hiển thị (có thể từ bfcache)
  window.addEventListener('pageshow', (event) => {
    // event.persisted = true nếu trang được khôi phục từ bfcache
    if (event.persisted) {
      console.log('Page was restored from bfcache');

      // Thực hiện các hành động cần thiết khi trang được khôi phục từ bfcache
      handleBFCacheRestore();
    }
  });

  // Xử lý khi trang bị ẩn (có thể đưa vào bfcache)
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      console.log('Page might enter bfcache');

      // Thực hiện các hành động cần thiết trước khi trang được đưa vào bfcache
      handleBFCacheFreeze();
    }
  });

  // Xử lý khi trang được khôi phục từ bfcache bằng cách sử dụng sự kiện 'visibilitychange'
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible');

      // Thực hiện các hành động cần thiết khi trang trở nên hiển thị
      // Điều này có thể giúp đồng bộ trạng thái sau khi trang đã bị ẩn
      refreshAuthState();
    } else {
      console.log('Page became hidden');
    }
  });

  // Thêm sự kiện beforeunload để vô hiệu hóa bfcache cho các trang đăng nhập/đăng xuất
  // Điều này giúp tránh các vấn đề với trạng thái xác thực khi sử dụng bfcache
  if (window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/logout') ||
      window.location.pathname.includes('/register')) {
    disableBFCache();
  }

  // Thiết lập các tham số meta để kiểm soát bfcache
  setupBFCacheMetaTags();
}

/**
 * Xử lý khi trang được khôi phục từ bfcache
 */
function handleBFCacheRestore() {
  // Cách triệt để nhất: tải lại trang để tránh các vấn đề với bfcache
  // Điều này sẽ giải quyết các lỗi liên quan đến extension port
  window.location.reload();

  // Nếu không muốn tải lại trang, có thể chỉ cập nhật các phần cần thiết
  // refreshAuthState();
}

/**
 * Xử lý khi trang được đưa vào bfcache
 */
function handleBFCacheFreeze() {
  // Đóng các kết nối, xóa các tham chiếu đến các đối tượng DOM, v.v.

  // Có thể đóng các kết nối WebSocket, EventSource, v.v.
  closeConnections();
}

/**
 * Cập nhật trạng thái xác thực
 */
function refreshAuthState() {
  // Cập nhật trạng thái xác thực từ localStorage
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Nếu có token và user, cập nhật trạng thái xác thực
  if (token && user) {
    console.log('Refreshing auth state from localStorage');

    // Cập nhật header Authorization cho axios
    if (window.axios) {
      window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

/**
 * Đóng các kết nối
 */
function closeConnections() {
  // Đóng các kết nối WebSocket, EventSource, v.v.
  // Ví dụ:
  // if (window.myWebSocket) {
  //   window.myWebSocket.close();
  // }
}

/**
 * Vô hiệu hóa bfcache cho trang hiện tại
 * Lưu ý: Chỉ sử dụng khi cần thiết vì sẽ làm giảm hiệu suất điều hướng
 */
export function disableBFCache() {
  // Thêm sự kiện unload để vô hiệu hóa bfcache
  window.addEventListener('unload', () => {
    // Hàm rỗng, chỉ để vô hiệu hóa bfcache
  });

  // Thêm sự kiện beforeunload để vô hiệu hóa bfcache
  window.addEventListener('beforeunload', () => {
    // Hàm rỗng, chỉ để vô hiệu hóa bfcache
  });

  // Thêm thẻ meta để vô hiệu hóa bfcache
  const metaTag = document.createElement('meta');
  metaTag.name = 'Cache-Control';
  metaTag.content = 'no-store, no-cache, must-revalidate, proxy-revalidate';
  document.head.appendChild(metaTag);

  // Thêm thẻ meta để vô hiệu hóa bfcache trong Firefox
  const metaTagFF = document.createElement('meta');
  metaTagFF.httpEquiv = 'Pragma';
  metaTagFF.content = 'no-cache';
  document.head.appendChild(metaTagFF);
}

/**
 * Thiết lập các tham số meta để kiểm soát bfcache
 */
export function setupBFCacheMetaTags() {
  // Tạo thẻ meta để kiểm soát bfcache
  const metaTag = document.createElement('meta');
  metaTag.name = 'Cache-Control';
  metaTag.content = 'no-store';
  document.head.appendChild(metaTag);
}
