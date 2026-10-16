// Validates req.body against a Zod schema.
// On success, req.body is replaced with the cleaned data (unknown fields are removed).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    const first = errors[0];

    return res.status(400).json({
      success: false,
      message: first.field ? `${first.field}: ${first.message}` : first.message,
      errors,
    });
  }

  req.body = result.data;
  next();
};