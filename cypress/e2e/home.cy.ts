describe("home page", () => {
  it("renders when signed in", () => {
    cy.login();
    cy.visit("/");
    cy.contains("Welcome to Terra");
  });

  it("renders when signed out", () => {
    cy.visit("/");
    cy.contains("Sign in with Google");
  });
});
