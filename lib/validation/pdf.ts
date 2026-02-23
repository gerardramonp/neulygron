type ValidationSuccess = {
  success: true;
  file: Blob;
};

type ValidationError = {
  success: false;
  message: string;
  status: number;
};

type ValidationResult = ValidationSuccess | ValidationError;

export async function validatePdfUpload(
  request: Request,
): Promise<ValidationResult> {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return {
      success: false,
      message: "Invalid form data payload.",
      status: 400,
    };
  }

  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return {
      success: false,
      message: "Missing PDF file upload.",
      status: 400,
    };
  }

  if (file.type !== "application/pdf") {
    return {
      success: false,
      message: "Only PDF files are supported.",
      status: 415,
    };
  }

  return {
    success: true,
    file,
  };
}
