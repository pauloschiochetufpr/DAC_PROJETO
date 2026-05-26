export function getHttpErrorMessage(err, fallback) {
  return (
    err.response?.data?.message ||
    err.response?.data?.erro ||
    err.message ||
    fallback
  );
}
