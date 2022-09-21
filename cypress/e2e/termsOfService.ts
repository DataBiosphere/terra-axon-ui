describe("terms of service", () => {
  it("succeeds", () => {
    cy.visit("/termsOfService");
    cy.findByText("TERMS OF SERVICE");
  });
});
