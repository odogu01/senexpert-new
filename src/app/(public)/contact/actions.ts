'use server';

export interface ContactFormState {
  success: boolean;
  error?: string;
  submitted: boolean;
}

export async function submitContactForm(
  prevState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const service = formData.get('service') as string;
  const message = formData.get('message') as string;

  // Validate required fields
  if (!name || !email || !message) {
    return { success: false, error: 'Name, email, and message are required.', submitted: false };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please provide a valid email address.', submitted: false };
  }

  try {
    // In production, store in MongoDB or send email notification
    console.log('[Contact Form Submission]', { name, email, phone, service, message, submittedAt: new Date().toISOString() });

    // Simulate brief processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, submitted: true };
  } catch (error) {
    console.error('[Contact Form Error]', error);
    return { success: false, error: 'Something went wrong. Please try again later.', submitted: false };
  }
}
