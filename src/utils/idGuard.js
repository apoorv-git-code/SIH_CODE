// Rejects anything that looks like a real, unmasked government ID number.
function isNotRawIdNumber(value) {
  if (typeof value !== 'string') return true;
  const looksLikeRawId = /^\d{10,14}$/.test(value.replace(/\s|-/g, ''));
  return !looksLikeRawId;
}

module.exports = { isNotRawIdNumber };