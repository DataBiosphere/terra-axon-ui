describe("terms of service", () => {
  it("succeeds", () => {
    cy.visit("/terms-of-service");

    cy.renderAndCompareDocument(
      "src/docs/termsOfService.html",
      "Terms of Service"
    );
  });
});
