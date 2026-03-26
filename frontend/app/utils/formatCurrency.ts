export default (amount?: number, currency = "NGN") => {
  if (!amount) return "";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
