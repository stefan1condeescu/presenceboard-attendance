function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateOptionalDateRange(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);

  if ((startValue && !start) || (endValue && !end)) {
    return 'Please enter valid dates.';
  }

  if (start && end && end <= start) {
    return 'End date must be after start date.';
  }

  return null;
}

function validateRequiredDateRange(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);

  if (!start || !end) {
    return 'Start and end dates are required.';
  }

  if (end <= start) {
    return 'End date must be after start date.';
  }

  return null;
}

module.exports = {
  parseDate,
  validateOptionalDateRange,
  validateRequiredDateRange,
};
