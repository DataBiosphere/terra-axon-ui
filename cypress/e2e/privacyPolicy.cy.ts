describe("privacy policy", () => {
  it("succeeds", () => {
    cy.visit("/privacy-policy");

    cy.renderAndCompareDocument(
      "src/docs/privacyPolicy.html",
      "Privacy policy"
    );
  });
});
