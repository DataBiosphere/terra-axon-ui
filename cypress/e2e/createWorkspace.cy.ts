import "@testing-library/cypress/add-commands";

describe("create workspace", () => {
  beforeEach("user is logged in", () => cy.login());

  const suffix = Math.random().toString().substring(2, 10);
  const name = "test workspace " + suffix;
  const id = "test-workspace-" + suffix;

  it("succeeds", () => {
    cy.intercept("POST", "**", (req) => {
      req.headers["FAKE_CREATE_TIME"] = "1500";
    });

    cy.visit("/workspaces");
    cy.findAllByRole("button", { name: "New workspace" }).first().click();
    cy.findByRole("heading", { name: "Create a new workspace" });

    cy.findByRole("textbox", { name: "Name" }).type(name);
    cy.findByRole("textbox", { name: "ID" }).should("have.value", id);

    cy.findByRole("button", { name: "Next" }).click();
    cy.findByRole("textbox", { name: "Description" }).type(
      "Test workspace description"
    );

    cy.findByRole("button", { name: "Create" }).click();
    cy.url().should("include", `/workspaces/${id}`);
    cy.findByRole("heading", { name: name });

    const preparingText = "Preparing your new workspace...";
    cy.findByText(preparingText).should("exist");
    cy.findByText(preparingText, {
      timeout: 5 * 60 * 1000, // Allow time for context to be created.
    }).should("not.exist");

    cy.findByText(id);
    cy.findByText("Test workspace description");

    // TODO(PF-1840): Disable GCP project check until race is resolved.
    /*
    cy.findByRole("link", { name: /^terra-/ }).then((link) => {
      const gcpProjectId = link.text();
      cy.wrap(link).should(
        "have.attr",
        "href",
        "https://console.cloud.google.com/home/dashboard?project=" +
          gcpProjectId
      );
    });
    */
  });

  it("rejects duplicate ID", () => {
    cy.visit("/workspaces");
    cy.findAllByRole("button", { name: "New workspace" }).first().click();
    cy.findByRole("heading", { name: "Create a new workspace" });

    // ID field is generated with a numerical prefix to make it unique.
    cy.findByRole("textbox", { name: "Name" }).type(name);
    cy.findByRole("textbox", { name: "ID" })
      .invoke("val")
      .should("match", /test-workspace-[0-9]+/);

    // Displays an error when the non-unique ID is forced.
    cy.findByRole("textbox", { name: "ID" }).clear().type(id);
    cy.findByText("This ID already exists. Must be unique.");
    cy.findByRole("button", { name: "Next" }).should("be.disabled");
  });
});
