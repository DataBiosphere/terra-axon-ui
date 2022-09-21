import raw from "raw.macro";
import { ReactElement } from "react";
import { PageContentCard } from "../components/pageContent";

/*
Source Doc: https://docs.google.com/document/d/1vFVGfRs-8Yi7xFqkawvZTugFRmYQIgPahH8uh5IJ8g4/edit?usp=sharing
Converted to HTML using: https://github.com/evbacher/gd2md-html 
*/
const content = raw("../docs/termsOfService.html");

export default function TermsOfServicePage(): ReactElement {
  return (
    <PageContentCard>
      <div
        role="document"
        aria-label="Terms of Service"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </PageContentCard>
  );
}
