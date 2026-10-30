// Form definitions shared by the browser forms and the /api/forms route (same validation on both sides).
// Field sets mirror the original Elementor forms on /contact-us/, /get-quote/ and /be-our-partner/.

export type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "radio" | "url";
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  options?: string[];
  placeholder?: string;
  autoComplete?: string;
};
export type FormKind = "contact" | "quote" | "partner";

export const FORMS: Record<FormKind, { title: string; fields: Field[] }> = {
  contact: {
    title: "Contact Our Team",
    fields: [
      { name: "firstName", label: "First Name", type: "text", autoComplete: "given-name" },
      { name: "lastName", label: "Last Name", type: "text", autoComplete: "family-name" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "company", label: "Company Name", type: "text", required: true, autoComplete: "organization" },
      { name: "jobTitle", label: "Job Title", type: "text", required: true, autoComplete: "organization-title" },
      { name: "employees", label: "No. of Employees", type: "text" },
      { name: "country", label: "Country/Region", type: "text", required: true, autoComplete: "country-name" },
      { name: "phone", label: "Phone No.", type: "tel", required: true, autoComplete: "tel" },
      { name: "message", label: "Message", type: "textarea" },
    ],
  },
  quote: {
    title: "Get Quote",
    fields: [
      { name: "firstName", label: "First Name", type: "text", autoComplete: "given-name" },
      { name: "lastName", label: "Last Name", type: "text", autoComplete: "family-name" },
      { name: "company", label: "Company Name", type: "text", autoComplete: "organization" },
      { name: "phone", label: "Phone No.", type: "tel", autoComplete: "tel" },
      { name: "employees", label: "No. of Employees", type: "text" },
      { name: "jobTitle", label: "Job Title", type: "text", autoComplete: "organization-title" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "requirement", label: "Requirement", type: "textarea", required: true },
      { name: "budget", label: "Budget (Min. $1000)", type: "number", required: true, min: 1000, placeholder: "Budget" },
      { name: "scope", label: "Scope defined?", type: "radio", required: true, options: ["Yes", "No"] },
      { name: "deadline", label: "Deadline (Weeks)", type: "number", required: true, min: 1, placeholder: "Time Required" },
    ],
  },
  partner: {
    title: "Become Our Partner",
    fields: [
      { name: "firstName", label: "First Name", type: "text", autoComplete: "given-name" },
      { name: "lastName", label: "Last Name", type: "text", autoComplete: "family-name" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Contact No.", type: "tel", required: true, autoComplete: "tel" },
      { name: "company", label: "Company Name", type: "text", required: true, autoComplete: "organization" },
      { name: "website", label: "Website", type: "url", required: true, placeholder: "https://", autoComplete: "url" },
    ],
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s.-]{7,20}$/;

export function validate(kind: FormKind, data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of FORMS[kind].fields) {
    const raw = data[f.name];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) {
      if (f.required) errors[f.name] = `${f.label} is required.`;
      continue;
    }
    if (v.length > (f.type === "textarea" ? 5000 : 200)) errors[f.name] = `${f.label} is too long.`;
    else if (f.type === "email" && !EMAIL.test(v)) errors[f.name] = "Enter a valid email address.";
    else if (f.type === "tel" && !PHONE.test(v)) errors[f.name] = "Enter a valid phone number.";
    else if (f.type === "url" && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(v)) errors[f.name] = "Enter a valid website address.";
    else if (f.type === "number") {
      const n = Number(v);
      if (!Number.isFinite(n)) errors[f.name] = `${f.label} must be a number.`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} must be at least ${f.min}.`;
    } else if (f.type === "radio" && f.options && !f.options.includes(v)) errors[f.name] = `Choose ${f.options.join(" or ")}.`;
  }
  return errors;
}
