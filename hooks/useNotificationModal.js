import { useState, useEffect } from "react";

/**
 * Hook để quản lý trạng thái của NotificationModal.
 * @param {number} autoHideDuration - Thời gian (ms) tự động ẩn. Mặc định là 2000ms.
 */
export const useNotificationModal = (autoHideDuration = 1500) => {
  const [modalState, setModalState] = useState({
    isVisible: false,
    type: "success", // 'success', 'error', 'warning'
    title: "",
    message: "",
    buttons: [], // <-- THAY ĐỔI: Thêm mảng buttons
  });

  // Tự động ẩn modal NẾU không có nút bấm
  useEffect(() => {
    // <-- THAY ĐỔI: Thêm điều kiện (chỉ tự ẩn khi không có nút)
    if (modalState.isVisible && modalState.buttons.length === 0) {
      const timer = setTimeout(() => {
        hideModal();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [modalState.isVisible, modalState.buttons, autoHideDuration]); // <-- THAY ĐỔI: Thêm 'buttons' vào dependency

  // Đóng modal
  const hideModal = () => {
    // <-- THAY ĐỔI: Reset mảng buttons khi đóng
    setModalState((prev) => ({ ...prev, isVisible: false, buttons: [] }));
  };

  // Hiện modal
  // <-- THAY ĐỔI: Thêm tham số 'buttons' (mặc định là mảng rỗng)
  const showModal = (type, title, message, buttons = []) => {
    setModalState({ isVisible: true, type, title, message, buttons });
  };

  // Các hàm tiện ích
  // <-- THAY ĐỔI: Thêm tham số 'buttons'
  const showSuccess = (title, message, buttons = []) => {
    showModal("success", title, message, buttons);
  };

  // <-- THAY ĐỔI: Thêm tham số 'buttons'
  const showError = (title, message, buttons = []) => {
    showModal("error", title, message, buttons);
  };

  // <-- THAY ĐỔI: Thêm tham số 'buttons'
  const showWarning = (title, message, buttons = []) => {
    showModal("warning", title, message, buttons);
  };

  // Trả về các props để truyền cho Component và các hàm để gọi
  return {
    modalProps: {
      isVisible: modalState.isVisible,
      type: modalState.type,
      title: modalState.title,
      message: modalState.message,
      buttons: modalState.buttons, // <-- THAY ĐỔI: Truyền buttons ra ngoài
      onClose: hideModal,
    },
    showSuccess,
    showError,
    showWarning,
  };
};