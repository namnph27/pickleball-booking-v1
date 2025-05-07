# Xử lý đồng thời trong tính năng đặt sân

## Giới thiệu

Tài liệu này mô tả cách hệ thống xử lý các yêu cầu đặt sân đồng thời để đảm bảo không xảy ra lỗi sân bị đặt trùng lặp.

## Vấn đề

Khi nhiều người dùng cùng đặt một khung giờ trên cùng một sân, có thể xảy ra tình huống race condition, dẫn đến việc cả hai người dùng đều nhận được xác nhận đặt sân thành công, nhưng thực tế chỉ có một người có thể sử dụng sân trong khung giờ đó.

## Giải pháp

Chúng tôi đã triển khai một cơ chế khóa (locking mechanism) để đảm bảo chỉ một người dùng có thể đặt sân trong một khung giờ cụ thể tại một thời điểm. Cơ chế này bao gồm:

1. **Bảng booking_locks**: Lưu trữ thông tin về các khóa đang hoạt động
2. **Giao dịch cơ sở dữ liệu (Transactions)**: Đảm bảo tính nhất quán của dữ liệu
3. **FOR UPDATE SKIP LOCKED**: Sử dụng tính năng của PostgreSQL để xử lý đồng thời

## Quy trình đặt sân

1. Người dùng gửi yêu cầu đặt sân
2. Hệ thống cố gắng lấy khóa cho khung giờ đó
   - Nếu khóa đã được người dùng khác nắm giữ, trả về lỗi 409 Conflict
   - Nếu lấy khóa thành công, tiếp tục quy trình
3. Hệ thống kiểm tra tính khả dụng của sân và khung giờ trong một giao dịch
4. Nếu khung giờ khả dụng, tạo đặt sân mới
5. Giải phóng khóa sau khi hoàn thành

## Cài đặt và cấu hình

### Cập nhật cơ sở dữ liệu

Chạy lệnh sau để tạo bảng booking_locks:

```bash
npm run update-db
```

### Chạy unit test

```bash
npm test
```

### Chạy performance test

```bash
npm run test:performance
```

## Xử lý lỗi

Khi một người dùng cố gắng đặt sân đang được người khác đặt, họ sẽ nhận được thông báo:

```json
{
  "message": "This timeslot is currently being booked by another user. Please try again in a moment."
}
```

## Hiệu suất

Hệ thống được thiết kế để xử lý các yêu cầu đặt sân trong thời gian không quá 5 giây, ngay cả khi có nhiều yêu cầu đồng thời.

## Giới hạn và cải tiến trong tương lai

1. Khóa hiện tại có thời gian sống là 30 giây, có thể điều chỉnh tùy theo nhu cầu
2. Có thể triển khai hàng đợi (queue) để xử lý các yêu cầu đặt sân khi hệ thống quá tải
3. Cân nhắc sử dụng Redis để lưu trữ khóa, giúp cải thiện hiệu suất
