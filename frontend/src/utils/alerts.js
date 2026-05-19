import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const baseOptions = {
  heightAuto: false,
  reverseButtons: true,
  confirmButtonColor: '#1f2937',
  cancelButtonColor: '#64748b',
};

export const showAlert = (options) => (
  Swal.fire({
    ...baseOptions,
    ...options,
  })
);

export const showSuccess = (title, text) => (
  showAlert({
    icon: 'success',
    title,
    text,
    confirmButtonText: '확인',
  })
);

export const showError = (title, text) => (
  showAlert({
    icon: 'error',
    title,
    text,
    confirmButtonText: '확인',
  })
);

export const showInfo = (title, text) => (
  showAlert({
    icon: 'info',
    title,
    text,
    confirmButtonText: '확인',
  })
);

export const confirmAction = async ({
  title,
  text,
  icon = 'warning',
  confirmButtonText = '확인',
  cancelButtonText = '취소',
  confirmButtonColor = '#dc2626',
}) => {
  const result = await showAlert({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
  });

  return result.isConfirmed;
};
