import raw from "raw.macro";
import { ReactElement } from "react";
import { PageContentCard } from "../components/pageContent";

/*
Source Doc: https://docs.google.com/document/d/1DKsot03UWfoogH1hbavrsB_74nO2gi4e/view?resourcekey=0-0xcdA83oBuDED9z8ktrHAg
Converted to HTML using: https://github.com/evbacher/gd2md-html 
Note: Table of Contents manually selected and converted separately. 
*/
const content = raw("../docs/privacyPolicy.html");

export default function PrivacyPolicyPage(): ReactElement {
  return (
    <PageContentCard>
      <div
        role="document"
        aria-label="Privacy policy"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </PageContentCard>
  );
}
