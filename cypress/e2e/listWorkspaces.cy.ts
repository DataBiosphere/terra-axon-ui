describe("list workspaces", () => {
  it("succeeds", () => {
    cy.login();
    cy.createWorkspace().then((workspace) => {
      cy.visit("/workspaces");
      cy.findByRole("link", { name: workspace.displayName }).click();
      cy.findByRole("heading", { name: workspace.displayName });
    });
  });
});
