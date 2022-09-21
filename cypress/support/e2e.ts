import { TestProfile } from "../../src/testing/profile";
import "./commands";

before(() => {
  if (Cypress.env("USE_FAKE")) {
    cy.apis().then(({ usersApi }) =>
      usersApi.inviteUser({ inviteeEmail: TestProfile.email })
    );
  }
});
