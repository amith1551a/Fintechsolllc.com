import FormRenderer from "./FormRenderer";

/** Fields of the original /get-quote/ Elementor form (also used where service pages embedded a quotation form). */
export default function QuoteForm() {
  return <FormRenderer kind="quote" />;
}
